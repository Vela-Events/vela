import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiAppIdParam } from '../common/decorators/api-app-id-param.decorator';
import { CurrentApp } from '../common/decorators/current-app.decorator';
import { AppMembershipGuard } from '../common/guards/app-membership.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { RequestAppContext } from '../common/interfaces/request-context.interface';
import { CreateEventSchemaDto } from './dto/create-event-schema.dto';
import { EventSchemaResponseDto } from './dto/event-schema-response.dto';
import { UpdateEventSchemaDto } from './dto/update-event-schema.dto';
import { SchemasService } from './schemas.service';

@ApiTags('schemas')
@ApiBearerAuth()
@ApiAppIdParam()
@Controller('apps/:appId/schemas')
@UseGuards(JwtAuthGuard, AppMembershipGuard)
export class SchemasController {
  constructor(private readonly schemasService: SchemasService) {}

  @Get()
  @ApiOkResponse({ type: [EventSchemaResponseDto] })
  async listSchemas(
    @CurrentApp() app: RequestAppContext,
  ): Promise<EventSchemaResponseDto[]> {
    const schemas = await this.schemasService.listForApp(app.appId);
    return schemas.map((schema) => EventSchemaResponseDto.fromEntity(schema));
  }

  @Get('by-event-name/:eventName')
  @ApiParam({
    name: 'eventName',
    description: 'Exact event name as used on ingest (e.g. order.placed)',
    example: 'order.placed',
  })
  @ApiOkResponse({ type: EventSchemaResponseDto })
  @ApiNotFoundResponse({
    description: 'No schema for this event name in the app',
  })
  async getSchemaByEventName(
    @CurrentApp() app: RequestAppContext,
    @Param('eventName') eventName: string,
  ): Promise<EventSchemaResponseDto> {
    const schema = await this.schemasService.findByEventName(
      app.appId,
      eventName,
    );
    return EventSchemaResponseDto.fromEntity(schema);
  }

  @Post()
  @ApiCreatedResponse({ type: EventSchemaResponseDto })
  async createSchema(
    @CurrentApp() app: RequestAppContext,
    @Body() dto: CreateEventSchemaDto,
  ): Promise<EventSchemaResponseDto> {
    const schema = await this.schemasService.create(app.appId, dto);
    return EventSchemaResponseDto.fromEntity(schema);
  }

  @Patch(':schemaId')
  @ApiOkResponse({ type: EventSchemaResponseDto })
  async updateSchema(
    @CurrentApp() app: RequestAppContext,
    @Param('schemaId') schemaId: string,
    @Body() dto: UpdateEventSchemaDto,
  ): Promise<EventSchemaResponseDto> {
    const schema = await this.schemasService.update(app.appId, schemaId, dto);
    return EventSchemaResponseDto.fromEntity(schema);
  }
}
