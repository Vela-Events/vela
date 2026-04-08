import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationDestinationKind } from '../common/enums/domain.enums';
import { EventEntity } from '../events/entities/event.entity';
import { IntegrationsService } from '../integrations/integrations.service';
import { NotificationDeliveryAttemptEntity } from './entities/notification-delivery-attempt.entity';
import { NotificationRuleEntity } from './entities/notification-rule.entity';
import { NotificationDeliveryService } from './delivery.service';

describe('NotificationDeliveryService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  });

  it('delivers Slack notifications through the webhook URL', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('ok'),
    });
    global.fetch = fetchMock as typeof fetch;
    const saveMock = jest
      .fn()
      .mockImplementation((value) => Promise.resolve(value));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationDeliveryService,
        {
          provide: getRepositoryToken(EventEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue({
              id: 'event_1',
              appId: 'app_1',
              eventName: 'user.signup',
              level: 'info',
              customerId: 'cust_1',
              occurredAt: new Date('2026-01-01T00:00:00.000Z'),
              payload: { email: 'user@example.com' },
              metadata: { source: 'web' },
            }),
          },
        },
        {
          provide: getRepositoryToken(NotificationRuleEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue({
              id: 'rule_1',
              appId: 'app_1',
              name: 'Signups',
            }),
          },
        },
        {
          provide: getRepositoryToken(NotificationDeliveryAttemptEntity),
          useValue: {
            create: jest.fn().mockImplementation((value) => value),
            save: saveMock,
          },
        },
        {
          provide: IntegrationsService,
          useValue: {
            getDestinationForDelivery: jest.fn().mockResolvedValue({
              id: 'dest_1',
              appId: 'app_1',
              kind: NotificationDestinationKind.SLACK_WEBHOOK,
              label: '#alerts',
              webhookUrl: 'https://hooks.slack.com/services/test',
              emailAddress: null,
              emailConfig: null,
            }),
          },
        },
      ],
    }).compile();

    const service = module.get(NotificationDeliveryService);
    await service.deliver({
      appId: 'app_1',
      eventId: 'event_1',
      ruleId: 'rule_1',
      destinationId: 'dest_1',
      channel: 'slack',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://hooks.slack.com/services/test',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(saveMock).toHaveBeenCalledTimes(2);
    const slackBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      blocks?: Array<{ type?: string }>;
    };
    expect(slackBody.blocks?.[0]?.type).toBe('header');
  });

  it('delivers email notifications through Resend', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.EMAIL_FROM = 'alerts@vela.dev';
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 202,
      text: jest.fn().mockResolvedValue('{"id":"email_1"}'),
    });
    global.fetch = fetchMock as typeof fetch;
    const saveMock = jest
      .fn()
      .mockImplementation((value) => Promise.resolve(value));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationDeliveryService,
        {
          provide: getRepositoryToken(EventEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue({
              id: 'event_1',
              appId: 'app_1',
              eventName: 'user.signup',
              level: 'info',
              customerId: 'cust_1',
              occurredAt: new Date('2026-01-01T00:00:00.000Z'),
              payload: { email: 'user@example.com' },
              metadata: { source: 'web' },
            }),
          },
        },
        {
          provide: getRepositoryToken(NotificationRuleEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue({
              id: 'rule_1',
              appId: 'app_1',
              name: 'Signups',
            }),
          },
        },
        {
          provide: getRepositoryToken(NotificationDeliveryAttemptEntity),
          useValue: {
            create: jest.fn().mockImplementation((value) => value),
            save: saveMock,
          },
        },
        {
          provide: IntegrationsService,
          useValue: {
            getDestinationForDelivery: jest.fn().mockResolvedValue({
              id: 'dest_1',
              appId: 'app_1',
              kind: NotificationDestinationKind.EMAIL,
              label: 'Ops',
              webhookUrl: null,
              emailAddress: 'ops@example.com',
              emailConfig: null,
            }),
          },
        },
      ],
    }).compile();

    const service = module.get(NotificationDeliveryService);
    await service.deliver({
      appId: 'app_1',
      eventId: 'event_1',
      ruleId: 'rule_1',
      destinationId: 'dest_1',
      channel: 'email',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(saveMock).toHaveBeenCalledTimes(2);
  });

  it('persists failed attempts and sends Discord embeds', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue('upstream failed'),
    });
    global.fetch = fetchMock as typeof fetch;
    const saveMock = jest
      .fn()
      .mockImplementation((value) => Promise.resolve(value));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationDeliveryService,
        {
          provide: getRepositoryToken(EventEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue({
              id: 'event_1',
              appId: 'app_1',
              eventName: 'checkout.failed',
              level: 'error',
              customerId: 'cust_9',
              occurredAt: new Date('2026-01-01T00:00:00.000Z'),
              payload: { orderId: 'ord_1' },
              metadata: { source: 'api' },
            }),
          },
        },
        {
          provide: getRepositoryToken(NotificationRuleEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue({
              id: 'rule_1',
              appId: 'app_1',
              name: 'Checkout failures',
            }),
          },
        },
        {
          provide: getRepositoryToken(NotificationDeliveryAttemptEntity),
          useValue: {
            create: jest.fn().mockImplementation((value) => value),
            save: saveMock,
          },
        },
        {
          provide: IntegrationsService,
          useValue: {
            getDestinationForDelivery: jest.fn().mockResolvedValue({
              id: 'dest_1',
              appId: 'app_1',
              kind: NotificationDestinationKind.DISCORD_WEBHOOK,
              label: 'Ops',
              webhookUrl: 'https://discord.com/api/webhooks/test',
              emailAddress: null,
              emailConfig: null,
            }),
          },
        },
      ],
    }).compile();

    const service = module.get(NotificationDeliveryService);

    await expect(
      service.deliver({
        appId: 'app_1',
        eventId: 'event_1',
        ruleId: 'rule_1',
        destinationId: 'dest_1',
        channel: 'discord',
        attemptNumber: 2,
      }),
    ).rejects.toThrow('Webhook delivery failed with 500: upstream failed');

    const discordBody = JSON.parse(
      fetchMock.mock.calls[0][1].body as string,
    ) as {
      embeds?: Array<{ title?: string }>;
    };
    expect(discordBody.embeds?.[0]?.title).toContain('checkout.failed');
    expect(saveMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: 'failed',
        attemptNumber: 2,
        responseCode: 500,
      }),
    );
  });
});
