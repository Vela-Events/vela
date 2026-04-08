import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppMembershipGuard } from '../common/guards/app-membership.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { EventSchemaEntity } from './entities/event-schema.entity';
import { SchemaValidatorService } from './schema-validator.service';
import { SchemasController } from './schemas.controller';
import { SchemasService } from './schemas.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventSchemaEntity])],
  controllers: [SchemasController],
  providers: [
    SchemasService,
    SchemaValidatorService,
    JwtAuthGuard,
    AppMembershipGuard,
  ],
  exports: [SchemasService, SchemaValidatorService, TypeOrmModule],
})
export class SchemasModule {}
