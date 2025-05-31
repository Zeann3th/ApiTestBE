import {
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import env from 'src/common/env';

@WebSocketGateway({
    cors: {
        origin: env.APP_URL,
    },
})
export class FlowGateway {
    @WebSocketServer()
    server: Server;

    sendLog(runId: string, logs: any[]) {
        this.server.to(runId).emit('flow:log', logs);
    }

    sendDone(runId: string, message: string) {
        this.server.to(runId).emit('flow:done', { message });
    }

    handleConnection(socket: any) {
        socket.on('join-flow', (runId: string) => {
            socket.join(runId);
        });
    }
}
