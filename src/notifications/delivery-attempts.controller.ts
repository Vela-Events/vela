import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiAppIdParam } from '../common/decorators/api-app-id-param.decorator';
import { CurrentApp } from '../common/decorators/current-app.decorator';
import { AppMembershipGuard } from '../common/guards/app-membership.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { RequestAppContext } from '../common/interfaces/request-context.interface';
import { DeliveryAttemptQueryDto } from './dto/delivery-attempt-query.dto';
import { DeliveryAttemptListResponseDto } from './dto/delivery-attempt-list-response.dto';
import { DlqInspectionQueryDto } from './dto/dlq-inspection-query.dto';
import { DlqMessageResponseDto } from './dto/dlq-message-response.dto';
import { DlqReplayDto } from './dto/dlq-replay.dto';
import { DlqReplayResponseDto } from './dto/dlq-replay-response.dto';
import { NotificationDeliveryAttemptResponseDto } from './dto/notification-delivery-attempt-response.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@ApiAppIdParam()
@Controller('apps/:appId/notification-delivery-attempts')
@UseGuards(JwtAuthGuard, AppMembershipGuard)
export class DeliveryAttemptsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOkResponse({ type: DeliveryAttemptListResponseDto })
  @ApiOperation({ summary: 'List delivery attempts for an app' })
  async listDeliveryAttempts(
    @CurrentApp() app: RequestAppContext,
    @Query() query: DeliveryAttemptQueryDto,
  ): Promise<DeliveryAttemptListResponseDto> {
    const [page, summary] = await Promise.all([
      this.notificationsService.listDeliveryAttempts(app.appId, query),
      this.notificationsService.summarizeDeliveryAttempts(app.appId, query),
    ]);
    const metadata = await this.notificationsService.getDeliveryAttemptMetadata(
      app.appId,
      page.items,
    );

    return {
      items: page.items.map((attempt) =>
        NotificationDeliveryAttemptResponseDto.fromEntity(attempt, {
          ruleName: metadata.ruleNames.get(attempt.ruleId) ?? null,
          destinationLabel:
            metadata.destinationLabels.get(attempt.destinationId) ?? null,
        }),
      ),
      nextCursor: page.nextCursor,
      summary,
    };
  }

  @Get('dlq')
  @ApiOkResponse({ type: [DlqMessageResponseDto] })
  @ApiOperation({ summary: 'Inspect notification delivery DLQ messages' })
  async inspectDlq(
    @CurrentApp() app: RequestAppContext,
    @Query() query: DlqInspectionQueryDto,
  ): Promise<DlqMessageResponseDto[]> {
    const messages = await this.notificationsService.inspectDeliveryDlq(
      app.appId,
      query,
    );

    return messages.map((message) => ({
      messageId: message.messageId,
      topic: message.topic,
      publishedAt: message.publishedAt,
      retryCount: message.retryCount,
      finalError: message.finalError,
      payload: message.payload as unknown as Record<string, unknown>,
    }));
  }

  @Post('dlq/replay')
  @ApiOkResponse({ type: DlqReplayResponseDto })
  @ApiOperation({ summary: 'Replay notification delivery DLQ messages' })
  async replayDlq(
    @CurrentApp() app: RequestAppContext,
    @Body() dto: DlqReplayDto,
  ): Promise<DlqReplayResponseDto> {
    return this.notificationsService.replayDeliveryDlq(app.appId, dto);
  }
}
