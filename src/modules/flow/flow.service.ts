import { HttpException, Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/common/types/drizzle';
import { CreateFlowDto } from './dto/create-flow.dto';
import { endpoints, flowRuns, flows, flowSteps } from 'src/database/schema';
import { and, asc, count, eq } from 'drizzle-orm';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { RunFlowDto } from './dto/run-flow.dto';
import { Worker } from 'worker_threads';
import { FlowProcessorDto } from './dto/flow-processor.dto';
import * as path from 'path';
import { WorkerData } from 'src/common/types';

@Injectable()
export class FlowService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

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

    const steps = await this.db.select({ endpointId: flowSteps.endpointId })
      .from(flowSteps)
      .where(eq(flowSteps.flowId, id))
      .orderBy(asc(flowSteps.sequence));

    const stepIds = steps.map(({ endpointId }) => (endpointId));

    return { ...flow, sequence: stepIds };
  }

  async create({ name, description, sequence }: CreateFlowDto) {
    try {
      await this.db.transaction(async (tx) => {
        const flow = await tx.insert(flows).values({ name, description }).returning().get();

        if (sequence) {
          const flowStepValues = sequence.map((endpointId, index) => ({
            flowId: flow.id,
            endpointId,
            sequence: index + 1
          }));

          await tx.insert(flowSteps).values(flowStepValues);
        }
      });
      return { message: "Flow created successfully" };
    } catch (error) {
      if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") throw new HttpException("All endpoints in sequence must exist", 429);
      throw new HttpException("Internal Server Error", 500);
    }
  }

  async update(id: string, { name, description, sequence }: UpdateFlowDto) {
    await this.getById(id);

    if (name || description) {
      await this.db.update(flows)
        .set({
          ...(name && { name }),
          ...(description && { description }),
        })
        .where(eq(flows.id, id));
    }

    if (sequence) {
      const flowStepValues = sequence.map((endpointId, index) => ({
        flowId: id,
        endpointId,
        sequence: index + 1
      }));

      await this.db.insert(flowSteps).values(flowStepValues)
        .onConflictDoUpdate({
          target: [flowSteps.flowId, flowSteps.sequence],
          set: {
            endpointId: flowSteps.endpointId,
            sequence: flowSteps.sequence
          }
        });
    }
    return { message: "Flow updated successfully" };
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

  async run(id: string, { ccu, threads, duration, input }: RunFlowDto) {
    await this.getById(id);

    const steps = await this.db.select().from(flowSteps)
      .where(eq(flowSteps.flowId, id))
      .leftJoin(endpoints, eq(flowSteps.endpointId, endpoints.id))
      .orderBy(flowSteps.sequence);

    try {
      const workerPromises: Promise<{ total: number, error: number, latency: number }>[] = [];
      const startedAt = new Date().toISOString();

      for (let i = 1; i <= threads; i++) {
        const assignedCCU = i === threads ? ccu - (threads - 1) * Math.ceil(ccu / threads) : Math.ceil(ccu / threads);
        const workerData = { id: i, ccu: assignedCCU, duration, steps, input } as WorkerData;

        workerPromises.push(this.createWorker(path.join(__dirname, 'flow.worker.js'), workerData));
      }

      const results = await Promise.allSettled(workerPromises);
      const stats = results.reduce((acc, result) => {
        if (result.status === 'fulfilled') {
          acc.total += result.value.total;
          acc.error += result.value.error;
          acc.latency += result.value.latency;
        } else {
          console.error(`Worker failed: ${result.reason}`);
          acc.failed = true;
        }
        return acc;
      }, { total: 0, error: 0, latency: 0, failed: false });


      const success = stats.total - stats.error;

      await this.db.insert(flowRuns).values({
        flowId: id,
        status: stats.failed ? "FAILED" : "COMPLETED",
        ccu,
        threads,
        startedAt,
        completedAt: new Date().toISOString(),
        successRate: stats.total > 0 ? success / stats.total : 0,
        throughput: duration > 0 ? success / duration : 0,
        latency: stats.total > 0 ? stats.latency / stats.total : 0,
      });
    } catch (error) {
      console.error(error);
      throw new HttpException("Internal Server Error", 500);
    }
  }

  private async createWorker(workerPath: string, workerData: WorkerData): Promise<{ total: number, error: number, latency: number }> {
    return new Promise((resolve, reject) => {
      let total = 0;
      let error = 0;
      let latency = 0;

      const worker = new Worker(workerPath, { workerData });

      worker.on('message', (message) => {
        if (message.type === 'log') {
          console.log(`Worker ${workerData.id}:`, message.message);
        } else if (message.type === 'success') {
          total += message.total;
          error += message.error;
          latency += message.latency;
        }
      });

      worker.on('error', (error) => {
        console.error(`Worker ${workerData.id} error:`, error);
        reject(error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Worker ${workerData.id} stopped with exit code ${code}`);
          reject(new Error(`Worker exited with code ${code}`));
        } else {
          resolve({ total, error, latency });
        }
      });
    });
  }
}
