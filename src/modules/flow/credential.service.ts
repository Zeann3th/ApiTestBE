import { Injectable, Logger } from "@nestjs/common";
import { UserCredentials } from "src/common/types";

@Injectable()
export class CredentialService {
    private readonly logger: Logger = new Logger(CredentialService.name);
    private credentialQueue: UserCredentials[];
    private credentialLock: Set<string>;
    private allowReuse: boolean;
    private reuseIndex: number = 0;

    constructor(credentials: UserCredentials[], ccu: number) {
        this.credentialQueue = [...credentials];
        this.credentialLock = new Set();

        this.allowReuse = credentials.length < ccu;

        this.logger.log(`Initialized with ${credentials.length} credentials, CCU: ${ccu || 'unknown'}, Reuse: ${this.allowReuse}`);
    }

    acquire(): UserCredentials | null {
        if (this.credentialQueue.length === 0) return null;

        if (this.allowReuse) {
            const credential = this.credentialQueue[this.reuseIndex % this.credentialQueue.length];
            this.reuseIndex++;
            return credential;
        } else {
            for (const cred of this.credentialQueue) {
                const key = JSON.stringify(cred);
                if (!this.credentialLock.has(key)) {
                    this.credentialLock.add(key);
                    return cred;
                }
            }
            return null;
        }
    }

    release(cred: UserCredentials): void {
        if (!this.allowReuse) {
            const key = JSON.stringify(cred);
            this.credentialLock.delete(key);
        }
    }

    available(): number {
        if (this.allowReuse) {
            return this.credentialQueue.length;
        } else {
            return this.credentialQueue.length - this.credentialLock.size;
        }
    }

    isReuseMode(): boolean {
        return this.allowReuse;
    }
}