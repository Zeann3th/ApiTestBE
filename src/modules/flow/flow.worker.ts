import { parentPort, workerData } from 'worker_threads';
import { WorkerData } from 'src/common/types';
import { RunnerService } from '../runner/runner.service';
import pLimit from 'p-limit';

const { ccu, id, duration, steps, input } = workerData as WorkerData;

let stopped = false;
const endTime = Date.now() + duration * 1000;

setTimeout(() => {
    stopped = true;
    parentPort?.postMessage({ type: 'log', message: `Thread ${id} stopped after ${duration}s` });
}, duration * 1000);

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function requestLoop() {
    let success = 0;
    let error = 0;
    let latency = 0;
    const limit = pLimit(Math.min(20, ccu));

    while (!stopped && Date.now() < endTime) {
        const promises: Promise<void>[] = [];

        for (let i = 0; i < ccu; i++) {
            const cloned = { ...input };

            promises.push(limit(async () => {
                const start = performance.now();
                try {
                    await RunnerService.runFlow(steps, cloned);
                    success++;
                    latency += performance.now() - start;
                } catch (err: any) {
                    error++;
                    parentPort?.postMessage({ type: 'log', message: `Thread ${id} error: ${err.message}` });
                }
            }));
        }

        await Promise.allSettled(promises);
        await delay(10);
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
