import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountsModule } from './accounts/accounts.module';
import { ClientSecretsModule } from './client-secrets/client-secrets.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { EventsModule } from './events/events.module';
import { HealthModule } from './health/health.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SchemasModule } from './schemas/schemas.module';
import { AppsModule } from './apps/apps.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      validate: validateEnv,
      expandVariables: true,
    }),
    DatabaseModule.register(),
    MessagingModule,
    HealthModule,
    AuthModule,
    AccountsModule,
    ClientSecretsModule,
    AppsModule,
    EventsModule,
    SchemasModule,
    NotificationsModule,
    IntegrationsModule,
    AnalyticsModule,
    RealtimeModule,
  ],
})
export class AppModule {}
