import { parentPort, workerData } from 'worker_threads';
import { WorkerData } from 'src/common/types';
import { RunnerService } from '../runner/runner.service';

const { ccu, id, duration, steps, input } = workerData as WorkerData;

let stopped = false;
const endTime = Date.now() + duration * 1000;

setTimeout(() => {
    stopped = true;
    parentPort?.postMessage({ type: 'log', message: `Thread ${id} stopped after ${duration}s` });
}, duration * 1000);

async function requestLoop() {
    let success = 0;
    let error = 0;
    let latency = 0;

    while (!stopped && Date.now() < endTime) {
        const promises: Promise<void>[] = [];

        for (let i = 0; i < ccu; i++) {
            const data = { ...input };

            const promise = RunnerService.runFlow(steps, data)
                .then(result => {
                    success++;
                    latency += result.latency || 0;
                })
                .catch(err => {
                    error++;
                    parentPort?.postMessage({ type: 'log', message: `Thread ${id} error: ${err.message}` });
                });

            promises.push(promise);
        }

        await Promise.all(promises);
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
