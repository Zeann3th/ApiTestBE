import { parentPort, workerData } from "worker_threads";
import { RunnerService } from "../runner/runner.service";

const { ccu, workerId, duration, nodes, input, runId } = workerData;

const runner = new RunnerService();
const endTime = Date.now() + duration * 1000;
let stopped = false;

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function spawnUser() {
    while (!stopped && Date.now() < endTime) {
        let data = structuredClone(input);

        for (const node of nodes) {
            try {
                const start = performance.now();
                data = (await runner.run(node, data)).data;

                const latency = performance.now() - start;
                parentPort?.postMessage({
                    type: "log",
                    payload: {
                        runId,
                        endpointId: node.id,
                        statusCode: 200,
                        responseTime: latency,
                        error: null,
                    },
                });
            } catch (err) {
                parentPort?.postMessage({
                    type: "log",
                    payload: {
                        runId,
                        endpointId: node.id,
                        statusCode: err.response?.status || 500,
                        responseTime: 0,
                        error: err.message,
                    },
                });
            }
        }

        await delay(90 + Math.floor(Math.random() * 40));
    }
}

async function run() {
    const users: Promise<void>[] = [];
    for (let i = 0; i < ccu; i++) {
        users.push(spawnUser());
    }

    await Promise.all(users);

    parentPort?.postMessage({ type: "done", message: `[Run ${runId}] Worker ${workerId} stopped after ${duration}s` });
    process.exit(0);
}

setTimeout(() => {
    stopped = true;
    parentPort?.postMessage({ type: "info", payload: { message: `[Run ${runId}] Worker ${workerId} stopped after ${duration}s` } });
}, duration * 1000);

run().catch((err) => {
    parentPort?.postMessage({
        type: "error",
        payload: {
            message: `[Run ${runId}] Worker ${workerId} crashed: ${err.message}`,
        },
    });
    process.exit(1);
});
