import { Injectable, Logger } from "@nestjs/common";
import { UserCredentials } from "src/common/types";

const HEADER_SIZE = 12; // 3 Int32 values: credentialCount, currentIndex, jsonLength

@Injectable()
export class CredentialService {
    private readonly logger = new Logger(CredentialService.name);
    private sharedBuffer: SharedArrayBuffer;
    private headerView: Int32Array;
    private credentials: UserCredentials[] = [];

    constructor(
        credentials: UserCredentials[],
        ccu: number,
        sharedBuffer?: SharedArrayBuffer
    ) {
        if (sharedBuffer) {
            this.sharedBuffer = sharedBuffer;
            this.initializeViews();
            this.loadCredentialsFromBuffer();
        } else {
            this.credentials = [...credentials];
            this.createSharedBuffer();
            this.initializeViews();
            this.initializeSharedState();
        }
    }

    private createSharedBuffer(): void {
        const credentialsJson = JSON.stringify(this.credentials);
        const encoded = new TextEncoder().encode(credentialsJson);
        const totalSize = HEADER_SIZE + encoded.length;

        this.sharedBuffer = new SharedArrayBuffer(totalSize);
    }

    private initializeViews(): void {
        this.headerView = new Int32Array(this.sharedBuffer, 0, 3);
    }

    private initializeSharedState(): void {
        try {
            const credentialsJson = JSON.stringify(this.credentials);
            const encoded = new TextEncoder().encode(credentialsJson);

            Atomics.store(this.headerView, 0, this.credentials.length); // credentialCount
            Atomics.store(this.headerView, 1, 0); // currentIndex
            Atomics.store(this.headerView, 2, encoded.length); // jsonLength

            const credentialsBuffer = new Uint8Array(this.sharedBuffer, HEADER_SIZE);
            credentialsBuffer.set(encoded);
        } catch (error) {
            throw error;
        }
    }

    private loadCredentialsFromBuffer(): void {
        try {
            const credentialCount = Atomics.load(this.headerView, 0);
            const jsonLength = Atomics.load(this.headerView, 2);

            if (credentialCount === 0 || jsonLength === 0) {
                this.credentials = [];
                return;
            }

            const credentialsBuffer = new Uint8Array(this.sharedBuffer, HEADER_SIZE, jsonLength);
            const credentialsJson = new TextDecoder().decode(credentialsBuffer);
            this.credentials = JSON.parse(credentialsJson);
        } catch (error) {
            this.credentials = [];
        }
    }

    acquire(): UserCredentials | null {
        const currentIndex = Atomics.add(this.headerView, 1, 1);
        const credentialIndex = currentIndex % this.credentials.length;
        return this.credentials[credentialIndex];
    }

    available(): number {
        return this.credentials.length;
    }

    getSharedBuffer(): SharedArrayBuffer {
        return this.sharedBuffer;
    }
}
