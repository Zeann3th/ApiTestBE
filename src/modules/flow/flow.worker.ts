import { parentPort, workerData } from 'worker_threads';
import { RunnerService } from '../runner/runner.service';
import { WorkerData } from 'src/common/types';

const { ccu, id, duration, steps, input } = workerData as WorkerData;

let stopped = false;
setTimeout(() => {
    stopped = true;
    parentPort?.postMessage({ type: 'log', message: `Thread ${id} stopped after ${duration}s` });
}, duration * 1000);

async function request() {
    const runner = new RunnerService();

    let successCount = 0;
    let errorCount = 0;
    let totalLatency = 0;

    const promises: Promise<void>[] = [];

    for (let i = 0; i < ccu; i++) {
        if (stopped) break;

        const data = { ...input };

        const promise = runner.runFlow(steps, data)
            .then(result => {
                successCount++;
                totalLatency += result.latency || 0;
            })
            .catch(err => {
                errorCount++;
                parentPort?.postMessage({ type: 'log', message: `Error in thread ${id}: ${err.message}` });
            });

        promises.push(promise);
    }

    await Promise.all(promises);

    parentPort?.postMessage({
        type: 'result',
        successCount,
        errorCount,
        totalLatency,
    });

    process.exit(0);
}

request().catch(err => {
    parentPort?.postMessage({ type: 'error', error: err.message });
    process.exit(1);
});
