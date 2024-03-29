import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/result',
  transports: ['websocket'],
  cors: {
    origin: '*',
  },
})
@UseGuards(AuthGuard('jwt'))
export class ResultGateway {
  @WebSocketServer() server: Server;

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody('roundId') roundId: string,
  ) {
    socket.join(`results-${roundId}`);
  }

  @SubscribeMessage('leave')
  async handleLeave(
    @ConnectedSocket() socket: Socket,
    @MessageBody('roundId') roundId: string,
  ) {
    socket.leave(`results-${roundId}`);
  }

  @SubscribeMessage('resultEntered')
  handleResultEntered(roundId: string) {
    this.server.to(`results-${roundId}`).emit('resultEntered');
  }
}
