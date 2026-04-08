import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppAccessGuard } from '../common/guards/app-access.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { EventEntity } from '../events/entities/event.entity';
import { NotificationDeliveryAttemptEntity } from '../notifications/entities/notification-delivery-attempt.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity, NotificationDeliveryAttemptEntity]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, JwtAuthGuard, AppAccessGuard],
})
export class AnalyticsModule {}
