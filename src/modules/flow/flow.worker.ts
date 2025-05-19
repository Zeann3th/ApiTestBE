import { parentPort, workerData } from 'worker_threads';
import { RunnerService } from '../runner/runner.service';
import { WorkerData } from 'src/common/types';

const { ccu, id, duration, steps, input } = workerData as WorkerData;

let stopped = false;
const endTime = Date.now() + duration * 1000;

setTimeout(() => {
    stopped = true;
    parentPort?.postMessage({ type: 'log', message: `Thread ${id} stopped after ${duration}s` });
}, duration * 1000);

function createLimiter(concurrency: number) {
    const queue: (() => void)[] = [];
    let active = 0;

    const next = () => {
        if (queue.length === 0 || active >= concurrency) return;
        active++;
        const task = queue.shift();
        task?.();
    };

    return function limit<T>(taskFn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            const run = async () => {
                try {
                    const result = await taskFn();
                    resolve(result);
                } catch (err) {
                    reject(err);
                } finally {
                    active--;
                    next();
                }
            };
            queue.push(run);
            next();
        });
    };
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function requestLoop() {
    let success = 0;
    let error = 0;
    let latency = 0;

    const limit = createLimiter(Math.min(20, ccu));

    while (!stopped && Date.now() < endTime) {
        const promises: Promise<void>[] = [];

        for (let i = 0; i < ccu; i++) {
            const clonedInput = { ...input };

            promises.push(limit(async () => {
                const start = performance.now();
                try {
                    await RunnerService.runFlow(steps, clonedInput);
                    success++;
                    latency += performance.now() - start;
                } catch (err: any) {
                    error++;
                    parentPort?.postMessage({ type: 'log', message: `Thread ${id} error: ${err.message}` });
                }
            }));
        }

        await Promise.allSettled(promises);
        await delay(100);
    }

    parentPort?.postMessage({
        type: 'success',
        success,
        error,
        latency,
    });

    process.exit(0);
}

requestLoop().catch(err => {
    parentPort?.postMessage({ type: 'log', message: `Thread ${id} fatal error: ${err.message}` });
    process.exit(1);
});
