import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from '../events/entities/event.entity';
import { IntegrationsModule } from '../integrations/integrations.module';
import { NotificationDestinationEntity } from '../integrations/entities/notification-destination.entity';
import { DeliveryAttemptsController } from './delivery-attempts.controller';
import { NotificationsController } from './notifications.controller';
import { NotificationDeliveryService } from './delivery.service';
import { NotificationDeliveryAttemptEntity } from './entities/notification-delivery-attempt.entity';
import { NotificationRuleEntity } from './entities/notification-rule.entity';
import { NotificationsService } from './notifications.service';
import { ConditionEvaluatorService } from './condition-evaluator.service';
import { AppMembershipGuard } from '../common/guards/app-membership.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationRuleEntity,
      EventEntity,
      NotificationDeliveryAttemptEntity,
      NotificationDestinationEntity,
    ]),
    forwardRef(() => IntegrationsModule),
  ],
  controllers: [NotificationsController, DeliveryAttemptsController],
  providers: [
    NotificationsService,
    NotificationDeliveryService,
    ConditionEvaluatorService,
    JwtAuthGuard,
    AppMembershipGuard,
  ],
  exports: [NotificationsService, NotificationDeliveryService, TypeOrmModule],
})
export class NotificationsModule {}
