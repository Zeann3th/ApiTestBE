import { parentPort, workerData } from 'worker_threads';
import { RunnerService } from '../runner/runner.service';
import { WorkerData } from 'src/common/types';

const { ccu, id, duration, steps, input } = workerData as WorkerData;

let stopped = false;
const endTime = Date.now() + duration * 1000;
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const runner = new RunnerService();

const spawnUser = async (userId: number, stats: { total: number, error: number, latency: number }) => {
    while (!stopped && Date.now() < endTime) {
        const clonedInput = structuredClone(input);
        const start = performance.now();
        try {
            await runner.runFlow(steps, clonedInput);
        } catch (err: any) {
            stats.error++;
            parentPort?.postMessage({ type: 'log', message: `Thread ${id} User ${userId} error: ${err.message}` });
        } finally {
            stats.total++;
            stats.latency += performance.now() - start;
        }

        await delay(90 + Math.floor(Math.random() * 40));
    }
}

const runUsers = async () => {
    const stats = { total: 0, error: 0, latency: 0 };

    const users: Promise<void>[] = [];
    for (let i = 0; i < ccu; i++) {
        users.push(spawnUser(i, stats));
    }

    await Promise.all(users);

    parentPort?.postMessage({
        type: 'success',
        total: stats.total,
        error: stats.error,
        latency: stats.latency,
    });

    process.exit(0);
}

setTimeout(() => {
    stopped = true;
    parentPort?.postMessage({ type: 'log', message: `Thread ${id} stopping after ${duration}s` });
}, duration * 1000);

runUsers().catch(err => {
    parentPort?.postMessage({ type: 'log', message: `Thread ${id} fatal error: ${err.message}` });
    process.exit(1);
});
