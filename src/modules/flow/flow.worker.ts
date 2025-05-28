import { parentPort, workerData } from "worker_threads";
import { RunnerService } from "../runner/runner.service";

type WorkerMessage =
    | {
        type: "log";
        payload: {
            runId: string;
            endpointId: string;
            statusCode: number;
            responseTime: number;
            error: string | null;
            createdAt: string;
        };
    }
    | {
        type: "done";
        payload: {
            message: string;
        }
    }
    | {
        type: "info";
        payload: {
            message: string;
        }
    };

// Khởi tạo
const { ccu, workerId, duration, rampUpTime, nodes, input, runId } = workerData;

const runner = new RunnerService();
const endTime = Date.now() + duration * 1000;
const abortController = new AbortController();
let stopped = false;

/**
 * Hàm chờ đơn giản
 */
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Hàm chờ với độ trễ ngẫu nhiên
 * @param base Thời gian cơ bản để chờ (mili giây)
 * @param variance Biến thiên để tạo độ trễ ngẫu nhiên (mili giây)
 */
const randomDelay = async (base: number, variance: number) =>
    await delay(base + Math.floor(Math.random() * variance)
    );

/**
 * Tạo và mô phỏng người dùng
 */
async function spawnUser() {
    let data = JSON.parse(JSON.stringify(input));

    while (!stopped && Date.now() < endTime) {
        for (const node of nodes) {
            if (stopped || Date.now() >= endTime) break;
            let statusCode: number = 500;
            let responseTime: number = 0;
            let error: any = null;

            try {
                const { data: runnerData, response } = await runner.run(node, data, abortController.signal);
                data = runnerData;

                statusCode = response.status;
                responseTime = response.latency;
            } catch (err: any) {
                error = err;
            } finally {
                const message: WorkerMessage = {
                    type: "log",
                    payload: {
                        runId,
                        endpointId: node.id,
                        statusCode,
                        responseTime,
                        error: error ? error.message : null,
                        createdAt: new Date().toISOString(),
                    }
                }
                parentPort?.postMessage(message);
            }
        }
        // Mô phỏng thời gian suy nghĩ, thao tác người dùng
        await randomDelay(3000, 4000);

        if (stopped || Date.now() >= endTime) break;
    }
}

/**
 * Luồng chạy chính
 */
async function run() {
    parentPort?.postMessage({
        type: "info",
        payload: { message: `[Worker ${workerId}] Starting ${ccu} concurrent users for ${duration}s` }
    });

    const users: Promise<void>[] = [];

    for (let i = 0; i < ccu; i++) {
        const delayTime = Math.floor((i / ccu) * rampUpTime * 1000);
        users.push(
            delay(delayTime).then(() => spawnUser())
                .catch((err: any) => {
                    parentPort?.postMessage({
                        type: "error",
                        payload: {
                            message: `[Worker ${workerId}] User ${i + 1} failed: ${err.message}`,
                        },
                    });
                })
        );
    }

    const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
            stopped = true;
            parentPort?.postMessage({
                type: "info",
                payload: { message: `[Worker ${workerId}] Duration timeout reached (${duration}s). Stopping users...` }
            });
            resolve();
        }, duration * 1000);
    });

    await timeoutPromise;

    parentPort?.postMessage({
        type: "info",
        payload: { message: `[Worker ${workerId}] Timeout reached. Aborting all requests and cleaning up...` }
    });

    abortController.abort();

    await delay(5000);

    setTimeout(() => {
        parentPort?.postMessage({
            type: "info",
            payload: { message: `[Worker ${workerId}] Force exiting...` }
        });
        process.exit(0);
    }, 100);
}

run()
    .then(() => process.exit(0))
    .catch((err: any) => {
        parentPort?.postMessage({
            type: "error",
            payload: {
                message: `[Run ${runId}] Worker ${workerId} crashed: ${err.message}`,
            },
        });
        process.exit(1);
    });
