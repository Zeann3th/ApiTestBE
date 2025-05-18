import { HttpException, Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/types/drizzle';
import { CreateFlowDto } from './dto/create-flow.dto';
import { flows, flowSteps } from 'src/database/schema';
import { and, asc, count, eq } from 'drizzle-orm';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { RunFlowDto } from './dto/run-flow.dto';
import { Worker } from 'worker_threads';
import { FlowProcessorDto } from './dto/flow-processor.dto';
import * as path from 'path';
import * as os from 'os';
import { copyFile } from 'fs/promises';

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
    const [flow] = await this.db.select()
      .from(flows).where(eq(flows.id, id));
    if (!flow) {
      throw new HttpException(`Flow ${id} does not exist`, 404);
    }

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
    const [flow] = await this.db.select()
      .from(flows).where(eq(flows.id, id));
    if (!flow) {
      throw new HttpException(`Flow ${id} does not exist`, 404);
    }

    await this.db.delete(flows)
      .where(eq(flows.id, id));
    return {};
  }

  async updateProcessor(id: string, { sequence, postProcessor }: FlowProcessorDto) {
    const [flow] = await this.db.select()
      .from(flows).where(eq(flows.id, id));
    if (!flow) {
      throw new HttpException(`Flow ${id} does not exist`, 404);
    }

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

  async run(id: string, { ccu, threads, duration }: RunFlowDto) {
    const [flow] = await this.db.select()
      .from(flows).where(eq(flows.id, id));
    if (!flow) {
      throw new HttpException(`Flow ${id} does not exist`, 404);
    }

    try {
      const sharedBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 3);
      const sharedView = new Int32Array(sharedBuffer);
      // sharedView[0] = requestCount;
      // sharedView[1] = errorCount;
      // sharedView[2] = totalLatency;

      const perThread = Math.ceil(ccu / threads);

      for (let i = 1; i <= threads; i++) {
        const assignedCCU = i === threads - 1
          ? ccu - perThread * i
          : perThread;

        const workerPath = await this.resolvePath();
        const worker = new Worker(workerPath, { workerData: { id: i, ccu: assignedCCU, duration, sharedBuffer } });

        worker.on("message", (message) => {
          if (message.type === "log") {
            console.log(message.message);
          }
        });
      }
      return { message: "Flow started successfully" };
    } catch (error) {
      console.error(error);
      throw new HttpException("Internal Server Error", 500);
    }
  }

  private async resolvePath() {
    const relativePath = path.join(__dirname, 'flow.worker.js');

    if (typeof process.pkg !== 'undefined') {
      const tmpPath = path.join(os.tmpdir(), 'flow.worker.js');
      await copyFile(relativePath, tmpPath);
      return tmpPath;
    }

    return relativePath;
  }
}
