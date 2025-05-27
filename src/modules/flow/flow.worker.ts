import { parentPort, workerData } from "worker_threads";
import { RunnerService } from "../runner/runner.service";

const { ccu, workerId, duration, nodes, input, runId } = workerData;
const runner = new RunnerService();
const endTime = Date.now() + duration * 1000;
let stopped = false;
const abortController = new AbortController();

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const randomDelay = (base: number, variance: number) =>
    base + Math.floor(Math.random() * variance);

async function spawnUser(userId: number) {
    const startDelay = randomDelay(userId * 50, 100);
    await delay(startDelay);

    let requestCount = 0;
    let errorCount = 0;

    while (!stopped && Date.now() < endTime) {
        let data = structuredClone(input);

        for (const node of nodes) {
            if (stopped || Date.now() >= endTime) break;

            try {
                const start = performance.now();
                data = (await runner.run(node, data, abortController.signal)).data;
                const latency = performance.now() - start;

                if (stopped || Date.now() >= endTime) break;

                requestCount++;

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

                if (latency > 5000) {
                    parentPort?.postMessage({
                        type: "info",
                        payload: {
                            message: `[Worker ${workerId}] Slow request: ${latency}ms to ${node.name || node.url}`
                        }
                    });
                }

            } catch (err) {
                if (stopped || Date.now() >= endTime) break;

                errorCount++;
                const error = err as Error;

                parentPort?.postMessage({
                    type: "log",
                    payload: {
                        runId,
                        endpointId: node.id,
                        statusCode: error.message.includes('Status:') ?
                            parseInt(error.message.match(/Status: (\d+)/)?.[1] || '500') : 500,
                        responseTime: 0,
                        error: error.message,
                    },
                });

                parentPort?.postMessage({
                    type: "info",
                    payload: {
                        message: `[Worker ${workerId}] Error: ${error.message}`
                    }
                });

                if (errorCount > 5) {
                    const delayTime = randomDelay(1000, 2000);
                    const delayStart = Date.now();
                    while (Date.now() - delayStart < delayTime && !stopped && Date.now() < endTime) {
                        await delay(Math.min(100, delayTime - (Date.now() - delayStart)));
                    }
                    errorCount = 0;
                }
            }
        }

        if (stopped || Date.now() >= endTime) break;

        const delayTime = randomDelay(90, 40);
        const delayStart = Date.now();
        while (Date.now() - delayStart < delayTime && !stopped && Date.now() < endTime) {
            await delay(Math.min(50, delayTime - (Date.now() - delayStart)));
        }
    }

    parentPort?.postMessage({
        type: "info",
        payload: {
            message: `[Worker ${workerId}] User ${userId} completed ${requestCount} requests with ${errorCount} errors`
        }
    });
}

async function run() {
    parentPort?.postMessage({
        type: "info",
        payload: { message: `[Worker ${workerId}] Starting ${ccu} concurrent users for ${duration}s` }
    });

    const users: Promise<void>[] = [];

    for (let i = 0; i < ccu; i++) {
        users.push(spawnUser(i));

        if (i > 0 && i % 10 === 0) {
            await delay(50);
        }
    }

    const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
            stopped = true;
            resolve();
        }, duration * 1000);
    });

    await Promise.race([
        Promise.all(users),
        timeoutPromise
    ]);

    abortController.abort();

    await delay(100);

    parentPort?.postMessage({
        type: "done",
        payload: { message: `[Run ${runId}] Worker ${workerId} stopped after ${duration}s` }
    });

    process.exit(0);
}

const statsInterval = setInterval(() => {
    if (!stopped) {
        try {
            const stats = runner.getConnectionStats();
            parentPort?.postMessage({
                type: "info",
                payload: {
                    message: `[Worker ${workerId}] Connection stats: HTTP sockets: ${stats.httpAgent.sockets}, HTTPS sockets: ${stats.httpsAgent.sockets}`
                }
            });
        } catch (e) {
        }
    } else {
        clearInterval(statsInterval);
    }
}, 10000);

run().catch((err) => {
    parentPort?.postMessage({
        type: "error",
        payload: {
            message: `[Run ${runId}] Worker ${workerId} crashed: ${err.message}`,
        },
    });
    process.exit(1);
});