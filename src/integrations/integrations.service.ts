import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppEntity } from '../apps/entities/app.entity';
import { NotificationDestinationKind } from '../common/enums/domain.enums';
import {
  decodeSecret,
  encodeSecret,
  isAllowedWebhookUrl,
} from '../common/utils/secrets.util';
import { IntegrationConnectionEntity } from './entities/integration-connection.entity';
import { NotificationDestinationEntity } from './entities/notification-destination.entity';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { NotificationDeliveryService } from '../notifications/delivery.service';

export interface ResolvedNotificationDestination {
  id: string;
  appId: string;
  kind: NotificationDestinationKind;
  label: string;
  webhookUrl: string | null;
  emailAddress: string | null;
  emailConfig: { from?: string; resendApiKey?: string } | null;
}

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(IntegrationConnectionEntity)
    private readonly connectionsRepository: Repository<IntegrationConnectionEntity>,
    @InjectRepository(NotificationDestinationEntity)
    private readonly destinationsRepository: Repository<NotificationDestinationEntity>,
    @InjectRepository(AppEntity)
    private readonly appsRepository: Repository<AppEntity>,
    @Inject(forwardRef(() => NotificationDeliveryService))
    private readonly notificationDeliveryService: NotificationDeliveryService,
  ) {}

  async listConnections(
    accountId: string,
  ): Promise<IntegrationConnectionEntity[]> {
    return this.connectionsRepository.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
    });
  }

  async createConnection(
    accountId: string,
    dto: CreateConnectionDto,
  ): Promise<IntegrationConnectionEntity> {
    const connection = this.connectionsRepository.create({
      accountId,
      provider: dto.provider,
      status: dto.status,
      displayName: dto.displayName,
      credentialsEnc: encodeSecret(
        dto.credentials ?? JSON.stringify({ provider: dto.provider }),
      ),
      externalTeamId: dto.externalTeamId ?? null,
    });

    return this.connectionsRepository.save(connection);
  }

  async deleteConnection(
    accountId: string,
    connectionId: string,
  ): Promise<void> {
    const result = await this.connectionsRepository.delete({
      id: connectionId,
      accountId,
    });

    if (!result.affected) {
      throw new NotFoundException('Connection not found');
    }
  }

  async listDestinations(
    appId: string,
  ): Promise<NotificationDestinationEntity[]> {
    return this.destinationsRepository.find({
      where: { appId },
      order: { createdAt: 'DESC' },
    });
  }

  async createDestination(
    appId: string,
    dto: CreateDestinationDto,
  ): Promise<NotificationDestinationEntity> {
    const app = await this.appsRepository.findOne({ where: { id: appId } });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    const connectionId = dto.connectionId ?? null;

    if (connectionId) {
      const connection = await this.connectionsRepository.findOne({
        where: { id: connectionId },
      });

      if (!connection || connection.accountId !== app.accountId) {
        throw new ForbiddenException(
          'Connection does not belong to the same account as the app',
        );
      }
    }

    this.assertDestinationPayload(dto.kind, dto.webhookUrl, dto.emailAddress);

    const destination = this.destinationsRepository.create({
      appId,
      connectionId,
      kind: dto.kind,
      label: dto.label,
      webhookUrlEnc: dto.webhookUrl ? encodeSecret(dto.webhookUrl) : null,
      emailAddress: dto.emailAddress ?? null,
      verifiedAt: dto.emailAddress ? null : null,
    });

    return this.destinationsRepository.save(destination);
  }

  async updateDestination(
    appId: string,
    destinationId: string,
    dto: UpdateDestinationDto,
  ): Promise<NotificationDestinationEntity> {
    const destination = await this.destinationsRepository.findOne({
      where: { id: destinationId, appId },
    });

    if (!destination) {
      throw new NotFoundException('Destination not found');
    }

    const nextKind = dto.kind ?? destination.kind;
    const nextWebhookUrl = dto.webhookUrl ?? undefined;
    const nextEmail = dto.emailAddress ?? undefined;
    this.assertDestinationPayload(nextKind, nextWebhookUrl, nextEmail, true);

    if (dto.label) destination.label = dto.label;
    if (dto.kind) destination.kind = dto.kind;
    if (dto.connectionId !== undefined)
      destination.connectionId = dto.connectionId ?? null;
    if (dto.webhookUrl !== undefined) {
      destination.webhookUrlEnc = dto.webhookUrl
        ? encodeSecret(dto.webhookUrl)
        : null;
    }
    if (dto.emailAddress !== undefined) {
      destination.emailAddress = dto.emailAddress ?? null;
    }

    return this.destinationsRepository.save(destination);
  }

  async testDestination(
    appId: string,
    destinationId: string,
  ): Promise<{ status: string; message: string }> {
    const destination = await this.destinationsRepository.findOne({
      where: { id: destinationId, appId },
    });

    if (!destination) {
      throw new NotFoundException('Destination not found');
    }

    await this.notificationDeliveryService.sendDestinationTest(
      appId,
      destinationId,
    );

    destination.verifiedAt = new Date();
    await this.destinationsRepository.save(destination);

    return {
      status: 'ok',
      message: `Test notification sent to ${destination.label}`,
    };
  }

  async ensureDestinationBelongsToApp(
    appId: string,
    destinationId: string,
  ): Promise<void> {
    const destination = await this.destinationsRepository.findOne({
      where: { id: destinationId, appId },
    });

    if (!destination) {
      throw new BadRequestException(
        `Destination ${destinationId} does not belong to this app`,
      );
    }
  }

  async getDestinationForDelivery(
    appId: string,
    destinationId: string,
  ): Promise<ResolvedNotificationDestination> {
    const destination = await this.destinationsRepository.findOne({
      where: { id: destinationId, appId },
    });

    if (!destination) {
      throw new NotFoundException('Destination not found');
    }

    const connection = destination.connectionId
      ? await this.connectionsRepository.findOne({
          where: { id: destination.connectionId },
        })
      : null;
    const decodedConnection = connection?.credentialsEnc
      ? decodeSecret(connection.credentialsEnc)
      : null;
    const emailConfig = decodedConnection
      ? this.parseEmailConfig(decodedConnection)
      : null;

    return {
      id: destination.id,
      appId: destination.appId,
      kind: destination.kind,
      label: destination.label,
      webhookUrl: destination.webhookUrlEnc
        ? decodeSecret(destination.webhookUrlEnc)
        : null,
      emailAddress: destination.emailAddress,
      emailConfig,
    };
  }

  private parseEmailConfig(
    rawValue: string,
  ): { from?: string; resendApiKey?: string } | null {
    try {
      const parsed = JSON.parse(rawValue) as Record<string, unknown>;
      return {
        from: typeof parsed.from === 'string' ? parsed.from : undefined,
        resendApiKey:
          typeof parsed.resendApiKey === 'string'
            ? parsed.resendApiKey
            : undefined,
      };
    } catch {
      return null;
    }
  }

  private assertDestinationPayload(
    kind: NotificationDestinationKind,
    webhookUrl?: string,
    emailAddress?: string,
    allowOmitted = false,
  ): void {
    if (kind === NotificationDestinationKind.EMAIL) {
      if (!allowOmitted && !emailAddress) {
        throw new BadRequestException(
          'Email destinations require an emailAddress',
        );
      }

      return;
    }

    if (!allowOmitted && !webhookUrl) {
      throw new BadRequestException(
        'Webhook destinations require a webhookUrl',
      );
    }

    if (webhookUrl && !isAllowedWebhookUrl(webhookUrl)) {
      throw new BadRequestException(
        'Webhook URL must use an approved Slack or Discord host',
      );
    }
  }
}
