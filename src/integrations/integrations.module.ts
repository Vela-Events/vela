import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppEntity } from '../apps/entities/app.entity';
import { AppMembershipGuard } from '../common/guards/app-membership.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { IntegrationsController } from './integrations.controller';
import { IntegrationConnectionEntity } from './entities/integration-connection.entity';
import { NotificationDestinationEntity } from './entities/notification-destination.entity';
import { IntegrationsService } from './integrations.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppEntity,
      IntegrationConnectionEntity,
      NotificationDestinationEntity,
    ]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, JwtAuthGuard, AppMembershipGuard],
  exports: [IntegrationsService, TypeOrmModule],
})
export class IntegrationsModule {}
