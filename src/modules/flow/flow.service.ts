import { HttpException, Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/common/types/drizzle';
import { CreateFlowDto } from './dto/create-flow.dto';
import { endpoints, flowLogs, flowRuns, flows, flowSteps } from 'src/database/schema';
import { and, asc, count, eq } from 'drizzle-orm';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { RunFlowDto } from './dto/run-flow.dto';
import { Worker } from 'worker_threads';
import { FlowProcessorDto } from './dto/flow-processor.dto';
import path from 'path';
import { ActionNode, UserCredentials, WorkerData, WorkerMessage } from 'src/common/types';
import { GatewayService } from '../gateway/gateway.service';

@Injectable()
export class FlowService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly gatewayService: GatewayService
  ) { }

  async getAll(page: number, limit: number) {
    const [[{ total }], flowList] = await Promise.all([
      this.db.select({ total: count() }).from(flows),
      this.db.select().from(flows)
        .limit(limit)
        .offset((page - 1) * limit)
    ]);

    return {
      total,
      data: flowList
    }
  }

  async getById(id: string) {
    const [flow] = await this.db.select()
      .from(flows).where(eq(flows.id, id))
    if (!flow) {
      throw new HttpException(`Flow ${id} does not exist`, 404)
    }

    const steps = await this.db.select()
      .from(flowSteps)
      .where(eq(flowSteps.flowId, id))
      .leftJoin(endpoints, eq(flowSteps.endpointId, endpoints.id))
      .orderBy(asc(flowSteps.sequence));

    const endpointList = steps.map(({ flow_steps, endpoints }) => {
      return { ...endpoints, postProcessor: flow_steps.postProcessor };
    })

    return { ...flow, sequence: endpointList };
  }

  async create({ name, description, sequence }: CreateFlowDto) {
    let flow: any;
    try {
      await this.db.transaction(async (tx) => {
        flow = await tx.insert(flows).values({ name, description }).returning().get();

        if (sequence) {
          const flowStepValues = sequence.map((endpointId, index) => ({
            flowId: flow.id,
            endpointId,
            sequence: index + 1
          }));

          await tx.insert(flowSteps).values(flowStepValues);
        }
      });
      return { ...flow, sequence };
    } catch (error) {
      if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") throw new HttpException("All endpoints in sequence must exist", 409);
      throw new HttpException("Internal Server Error", 500);
    }
  }

  async update(id: string, { name, description, sequence }: UpdateFlowDto) {
    await this.getById(id);
    let flow: any;
    try {
      await this.db.transaction(async (tx) => {
        if (name || description) {
          flow = await tx.update(flows)
            .set({
              ...(name && { name }),
              ...(description && { description }),
            })
            .where(eq(flows.id, id))
            .returning().get();
        }

        if (sequence) {
          const existingSteps = await tx.select({
            endpointId: flowSteps.endpointId,
            postProcessor: flowSteps.postProcessor,
            sequence: flowSteps.sequence
          })
            .from(flowSteps)
            .where(eq(flowSteps.flowId, id));

          const postProcessorMap = new Map(
            existingSteps.map(step => [step.endpointId, step.postProcessor])
          );

          await tx.delete(flowSteps)
            .where(eq(flowSteps.flowId, id));

          const flowStepValues = sequence.map((endpointId, index) => ({
            flowId: id,
            endpointId,
            sequence: index + 1,
            postProcessor: postProcessorMap.get(endpointId) || null
          }));

          await tx.insert(flowSteps).values(flowStepValues);
        }
      });
      return { ...flow, sequence };
    } catch (error) {
      if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") throw new HttpException("All endpoints in sequence must exist", 409);
      throw new HttpException("Internal Server Error", 500);
    }
  }

  async delete(id: string) {
    await this.getById(id);

    await this.db.delete(flows)
      .where(eq(flows.id, id));
    return {};
  }

  async updateProcessor(id: string, { sequence, postProcessor }: FlowProcessorDto) {
    await this.getById(id);

    const [step] = await this.db.select()
      .from(flowSteps)
      .where(and(
        eq(flowSteps.flowId, id),
        eq(flowSteps.sequence, sequence)
      ));

    if (!step) {
      throw new HttpException(`Step ${sequence} does not exist in flow ${id}`, 404);
    }

    await this.db.update(flowSteps)
      .set({ postProcessor })
      .where(and(
        eq(flowSteps.flowId, id),
        eq(flowSteps.sequence, sequence)
      ));

    return { message: "Flow updated successfully" };
  }

  async run(id: string, runId: string, { ccu, threads, duration, input, rampUpTime, credentials }: RunFlowDto) {
    await this.getById(id);

    const [nodes, flowRun] = await Promise.all([
      this.getFlowNodes(id),
      this.db.insert(flowRuns).values({
        id: runId,
        flowId: id,
        ccu,
        threads,
        duration,
        rampUpTime,
      }).returning().get()
    ]);

    try {
      const workerPromises: Promise<void>[] = [];

      for (let i = 1; i <= threads; i++) {
        const workerData = {
          runId: flowRun.id,
          ccu: this.distributeCCU(ccu, threads)[i - 1],
          rampUpTime,
          duration,
          nodes,
          input,
          credentials: this.distributeCredentials(credentials || [], threads)[i - 1] || []
        } as WorkerData;

        workerPromises.push(
          this.createWorker(path.join(__dirname, 'flow.worker.js'), workerData)
        );
      }

      await Promise.allSettled(workerPromises);

      await this.db.update(flowRuns)
        .set({ status: "COMPLETED", updatedAt: new Date().toISOString() })
        .where(eq(flowRuns.id, flowRun.id));

    } catch (error) {
      console.error(`[Run ${runId}] Error:`, error);
      throw new HttpException("Internal Server Error", 500);
    }
  }

  private async createWorker(workerPath: string, workerData: WorkerData): Promise<void> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerPath, { workerData });

      worker.on("message", async (message: WorkerMessage) => {
        if (message.type === "log") {
          try {
            await this.db.insert(flowLogs).values(message.payload);
            this.gatewayService.emitLog(workerData.runId, message.payload);
          } catch (error) {
            console.error(`[Worker] Error inserting log:`, error);
          }
        } else if (message.type === "done") {
          console.log(`[Worker ${message.payload.workerId}] ${message.payload.message}`);
          this.gatewayService.emitDone(workerData.runId, message.payload.message);
          resolve();
        } else if (message.type === "info") {
          console.log(message.payload.message);
        } else if (message.type === "error") {
          console.error(message.payload.message);
        }
      });

      worker.on("error", (error) => {
        console.error(`[Worker] Worker error:`, error);
        reject(error);
      });

      worker.on("exit", (code) => {
        if (code !== 0) {
          console.error(`[Worker] Worker stopped with exit code ${code}`);
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  private async getFlowNodes(id: string): Promise<ActionNode[]> {
    const steps = await this.db.select().from(flowSteps)
      .where(eq(flowSteps.flowId, id))
      .leftJoin(endpoints, eq(flowSteps.endpointId, endpoints.id))
      .orderBy(flowSteps.sequence);

    if (steps.length === 0) {
      throw new HttpException(`Flow ${id} does not have any steps`, 400);
    }

    return steps.map((step) => ({
      ...step.endpoints,
      postProcessor: step.flow_steps.postProcessor,
    }) as ActionNode);
  }

  private distributeCCU(ccu: number, threads: number): number[] {
    const base = Math.floor(ccu / threads);
    const remainder = ccu % threads;
    const distribution: number[] = Array(threads).fill(base);

    for (let i = 0; i < remainder; i++) {
      distribution[i]++;
    }

    return distribution;
  }

  private distributeCredentials(credentials: UserCredentials[], threads: number): UserCredentials[][] {
    if (threads <= 0) return [];

    const credentialsPerWorker: UserCredentials[][] = Array.from({ length: threads }, () => []);
    credentials.forEach((cred, index) => {
      credentialsPerWorker[index % threads].push(cred);
    });

    return credentialsPerWorker;
  }
}
