import { parentPort, workerData } from 'worker_threads';

const { ccu, id, duration, sharedBuffer } = workerData;

const sharedView = new Int32Array(sharedBuffer);

function simulateRequest() {
    return new Promise(resolve => {
        const latency = Math.floor(Math.random() * 300);
        setTimeout(() => resolve(latency), latency);
    });
}

(async () => {
    for (let i = 0; i < ccu; i++) {
        const latency = await simulateRequest();
        Atomics.add(sharedView, 0, 1);
        Atomics.add(sharedView, 2, 0);
        Atomics.add(sharedView, 1, latency);
        parentPort?.postMessage({ type: "log", message: `Thread ${id} request ${i + 1} done` });
    }

    parentPort?.postMessage({ type: "log", message: `Thread ${id} done` });
})();