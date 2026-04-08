import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MessageBusService } from '../messaging/message-bus.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly messageBus: MessageBusService,
  ) {}

  getHealth(): { status: 'ok'; service: string } {
    return {
      status: 'ok',
      service: 'vela-be',
    };
  }

  async getReadiness(): Promise<{
    status: 'ok';
    service: string;
    checks: {
      database: { status: 'ok' };
      broker: {
        status: 'ok';
        mode: 'rabbitmq' | 'memory';
        exchange: string;
      };
    };
  }> {
    await this.dataSource.query('SELECT 1');
    const broker = await this.messageBus.checkReadiness();

    return {
      status: 'ok',
      service: 'vela-be',
      checks: {
        database: { status: 'ok' },
        broker: {
          status: 'ok',
          mode: broker.mode,
          exchange: broker.exchange,
        },
      },
    };
  }
}
