import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppEntity } from '../apps/entities/app.entity';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { AppMembershipGuard } from '../common/guards/app-membership.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { EventSchemaEntity } from '../schemas/entities/event-schema.entity';
import { SchemaValidatorService } from '../schemas/schema-validator.service';
import { EventEntity } from './entities/event.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity, AppEntity, EventSchemaEntity]),
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    SchemaValidatorService,
    JwtAuthGuard,
    ApiKeyGuard,
    AppMembershipGuard,
  ],
  exports: [EventsService, TypeOrmModule],
})
export class EventsModule {}
