import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { verify } from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { AppEntity } from '../apps/entities/app.entity';
import { Topics } from '../common/constants/topics';
import { MessageBusService } from '../messaging/message-bus.service';
import { AccountEntity } from '../accounts/entities/account.entity';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly messageBus: MessageBusService,
    private readonly dataSource: DataSource,
  ) {
    this.messageBus.subscribe<{ appId: string; eventId: string }>(
      Topics.EVENTS_INGESTED,
      (payload) => {
        this.server?.to(`app:${payload.appId}`).emit('event.ingested', payload);
      },
      { consumerName: 'realtime-fanout' },
    );
  }

  async handleConnection(client: Socket): Promise<void> {
    const token = this.readBearerToken(client);

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = verify(token, process.env.JWT_SECRET!);

      if (
        !payload ||
        typeof payload !== 'object' ||
        typeof payload.sub !== 'string' ||
        typeof payload.email !== 'string'
      ) {
        client.disconnect(true);
        return;
      }

      const accountsRepository = this.dataSource.getRepository(AccountEntity);
      const account = await accountsRepository.findOne({
        where: { id: payload.sub, email: payload.email.toLowerCase() },
      });

      if (!account) {
        client.disconnect(true);
        return;
      }

      client.data.accountId = account.id;
    } catch {
      client.disconnect(true);
      return;
    }

    this.logger.debug(`Realtime client connected: ${client.id}`);
  }

  @SubscribeMessage('subscribe.app')
  handleAppSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { appId?: string },
  ): Promise<{ joined: boolean; room?: string }> {
    if (!body?.appId) {
      throw new WsException('appId is required');
    }

    return this.authorizeAndJoinRoom(client, body.appId);
  }

  private async authorizeAndJoinRoom(
    client: Socket,
    appId: string,
  ): Promise<{ joined: boolean; room?: string }> {
    const accountId = client.data.accountId as string | undefined;

    if (!accountId) {
      throw new WsException('Socket is not authenticated');
    }

    const appsRepository = this.dataSource.getRepository(AppEntity);
    const app = await appsRepository.findOne({
      where: { id: appId, accountId },
    });

    if (!app) {
      throw new WsException('App does not belong to the authenticated account');
    }

    const room = `app:${appId}`;
    void client.join(room);
    return { joined: true, room };
  }

  private readBearerToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    const headerToken = client.handshake.headers.authorization;
    const rawValue =
      typeof authToken === 'string'
        ? authToken
        : Array.isArray(headerToken)
          ? headerToken[0]
          : headerToken;

    if (!rawValue) {
      return null;
    }

    return rawValue.startsWith('Bearer ') ? rawValue.slice(7) : rawValue;
  }
}
