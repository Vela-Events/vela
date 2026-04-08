import { ExecutionContext } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { AccountEntity } from '../accounts/entities/account.entity';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MessageBusService } from '../messaging/message-bus.service';
import { EventSchemaEntity } from '../schemas/entities/event-schema.entity';
import { SchemaValidatorService } from '../schemas/schema-validator.service';
import { EventsService } from '../events/events.service';
import { EventEntity } from '../events/entities/event.entity';
import { AppEntity } from '../apps/entities/app.entity';

describe('Auth And Schema Integration', () => {
  describe('JWT auth flow', () => {
    it('issues a token and authenticates a request with JwtAuthGuard', async () => {
      const accountsRepository = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((value) => value),
        save: jest.fn().mockImplementation((value) =>
          Promise.resolve({
            id: 'acct_1',
            appsLimit: 3,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
            ...value,
          }),
        ),
      };

      const module: TestingModule = await Test.createTestingModule({
        imports: [JwtModule.register({ secret: 'test-jwt-secret' })],
        providers: [
          AccountsService,
          AuthService,
          JwtAuthGuard,
          {
            provide: getRepositoryToken(AccountEntity),
            useValue: accountsRepository,
          },
          {
            provide: DataSource,
            useValue: {
              getRepository: jest.fn().mockReturnValue({
                findOne: jest.fn().mockResolvedValue({
                  id: 'acct_1',
                  email: 'user@example.com',
                  name: 'Test User',
                }),
              }),
            },
          },
        ],
      }).compile();

      const authService = module.get(AuthService);
      const guard = module.get(JwtAuthGuard);

      const issued = await authService.issueSocialToken({
        provider: 'google',
        email: 'user@example.com',
        name: 'Test User',
      });

      const request = {
        headers: {
          authorization: `Bearer ${issued.accessToken}`,
        },
      };
      process.env.JWT_SECRET = 'test-jwt-secret';
      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(request).toMatchObject({
        user: {
          accountId: 'acct_1',
          email: 'user@example.com',
          name: 'Test User',
        },
      });
      delete process.env.JWT_SECRET;
    });
  });

  describe('schema-validated ingest', () => {
    it('rejects ingest when no schema exists for the event name', async () => {
      const eventsRepository = {
        create: jest.fn(),
        save: jest.fn(),
      };
      const schemasRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EventsService,
          SchemaValidatorService,
          MessageBusService,
          {
            provide: getRepositoryToken(EventEntity),
            useValue: eventsRepository,
          },
          {
            provide: getRepositoryToken(AppEntity),
            useValue: {},
          },
          {
            provide: getRepositoryToken(EventSchemaEntity),
            useValue: schemasRepository,
          },
        ],
      }).compile();

      const eventsService = module.get(EventsService);

      await expect(
        eventsService.ingest('app_1', [
          {
            event: 'unknown.event',
            data: { any: 'thing' },
            level: 'info',
          },
        ]),
      ).rejects.toThrow('No event schema registered for "unknown.event"');

      expect(eventsRepository.create).not.toHaveBeenCalled();
    });

    it('rejects ingest when a required schema field is missing', async () => {
      const eventsRepository = {
        create: jest.fn().mockImplementation((value) => value),
        save: jest.fn(),
      };
      const schemasRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'sch_1774737919717',
          appId: 'app_1',
          eventName: 'user.signup',
          fields: [
            {
              name: 'email',
              type: 'string',
              required: true,
            },
          ],
          metadataFields: [],
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EventsService,
          SchemaValidatorService,
          MessageBusService,
          {
            provide: getRepositoryToken(EventEntity),
            useValue: eventsRepository,
          },
          {
            provide: getRepositoryToken(AppEntity),
            useValue: {},
          },
          {
            provide: getRepositoryToken(EventSchemaEntity),
            useValue: schemasRepository,
          },
        ],
      }).compile();

      const eventsService = module.get(EventsService);

      await expect(
        eventsService.ingest('app_1', [
          {
            event: 'user.signup',
            data: {},
            level: 'info',
          },
        ]),
      ).rejects.toThrow('missing required payload field "email"');
    });
  });
});
