import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiAppIdParam } from '../common/decorators/api-app-id-param.decorator';
import { CurrentApp } from '../common/decorators/current-app.decorator';
import { AppMembershipGuard } from '../common/guards/app-membership.guard';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { RequestAppContext } from '../common/interfaces/request-context.interface';
import { BatchIngestEventsDto } from './dto/batch-ingest-events.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { EventsListResponseDto } from './dto/events-list-response.dto';
import { IngestEventDto } from './dto/ingest-event.dto';
import { IngestResponseDto } from './dto/ingest-response.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@ApiExtraModels(IngestEventDto, BatchIngestEventsDto, EventsListResponseDto)
@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('apps/:appId/events')
  @ApiAppIdParam()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AppMembershipGuard)
  @ApiOkResponse({ type: EventsListResponseDto })
  async listEvents(
    @CurrentApp() app: RequestAppContext,
    @Query() query: EventQueryDto,
  ): Promise<EventsListResponseDto> {
    const page = await this.eventsService.listForApp(app.appId, query);
    return {
      items: page.items.map((event) => EventResponseDto.fromEntity(event)),
      nextCursor: page.nextCursor,
    };
  }

  @Post('ingest')
  @ApiOperation({
    summary: 'Ingest events',
    description:
      'Accepts **one event** (flat JSON) or **a batch** `{ "events": [ ... ] }` (1–100 items).\n\n' +
      '**Auth:** app API key in the **`x-api-key`** header only (not a JWT).\n\n' +
      '**Schema:** You must register an event schema for each `event` name (`POST /v1/apps/{appId}/schemas`). Ingest is rejected if none exists; `data` and `metadata` are validated against that schema.',
  })
  @ApiSecurity('x-api-key')
  @ApiBody({
    description:
      'Either a single `IngestEventDto`, or `BatchIngestEventsDto` with an `events` array.',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(IngestEventDto) },
        { $ref: getSchemaPath(BatchIngestEventsDto) },
      ],
    },
    examples: {
      singleEvent: {
        summary: 'Single event',
        value: {
          event: 'order.placed',
          data: {
            orderId: 'ord_01hzyd8qj3v2x9k0',
            amountCents: 4999,
            currency: 'USD',
          },
          metadata: { environment: 'staging' },
          customer_id: 'cust_8821',
          level: 'info',
        },
      },
      batch: {
        summary: 'Batch (max 100)',
        value: {
          events: [
            {
              event: 'order.placed',
              data: {
                orderId: 'ord_a',
                amountCents: 100,
                currency: 'USD',
              },
              level: 'info',
            },
            {
              event: 'order.placed',
              data: {
                orderId: 'ord_b',
                amountCents: 200,
                currency: 'EUR',
              },
              level: 'info',
            },
          ],
        },
      },
    },
  })
  @ApiCreatedResponse({
    type: IngestResponseDto,
    description: 'All events accepted and stored',
  })
  @ApiUnauthorizedResponse({ description: 'Missing API key' })
  @ApiForbiddenResponse({ description: 'Invalid API key' })
  @ApiResponse({
    status: 400,
    description: 'DTO validation failed or event schema validation failed',
  })
  @UseGuards(ApiKeyGuard)
  async ingest(
    @CurrentApp() app: RequestAppContext,
    @Body() body: IngestEventDto | BatchIngestEventsDto,
  ): Promise<IngestResponseDto> {
    const payload = 'events' in body ? body.events : [body];
    const events = await this.eventsService.ingest(app.appId, payload);

    return {
      accepted: events.length,
      events: events.map((event) => EventResponseDto.fromEntity(event)),
    };
  }
}
