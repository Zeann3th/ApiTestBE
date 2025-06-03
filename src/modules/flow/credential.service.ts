import { Injectable } from "@nestjs/common";
import { UserCredentials } from "src/common/types";

@Injectable()
export class CredentialService {
    private credentialQueue: UserCredentials[];
    private credentialLock: Set<string>;

    constructor(credentials: UserCredentials[]) {
        this.credentialQueue = [...credentials];
        this.credentialLock = new Set();
    }

    acquire(): UserCredentials | null {
        for (const cred of this.credentialQueue) {
            const key = JSON.stringify(cred);
            if (!this.credentialLock.has(key)) {
                this.credentialLock.add(key);
                return cred;
            }
        }
        return null;
    }

    release(cred: UserCredentials): void {
        const key = JSON.stringify(cred);
        this.credentialLock.delete(key);
    }

    available(): number {
        return this.credentialQueue.length - this.credentialLock.size;
    }
}
