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
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiAppIdParam } from '../common/decorators/api-app-id-param.decorator';
import { CurrentApp } from '../common/decorators/current-app.decorator';
import { AppMembershipGuard } from '../common/guards/app-membership.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { RequestAppContext } from '../common/interfaces/request-context.interface';
import { CreateNotificationRuleDto } from './dto/create-notification-rule.dto';
import { NotificationRuleResponseDto } from './dto/notification-rule-response.dto';
import { UpdateNotificationRuleDto } from './dto/update-notification-rule.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@ApiAppIdParam()
@Controller('apps/:appId/notification-rules')
@UseGuards(JwtAuthGuard, AppMembershipGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOkResponse({ type: [NotificationRuleResponseDto] })
  async listRules(
    @CurrentApp() app: RequestAppContext,
  ): Promise<NotificationRuleResponseDto[]> {
    const rules = await this.notificationsService.listForApp(app.appId);
    return rules.map((rule) => NotificationRuleResponseDto.fromEntity(rule));
  }

  @Post()
  @ApiCreatedResponse({ type: NotificationRuleResponseDto })
  async createRule(
    @CurrentApp() app: RequestAppContext,
    @Body() dto: CreateNotificationRuleDto,
  ): Promise<NotificationRuleResponseDto> {
    const rule = await this.notificationsService.create(app.appId, dto);
    return NotificationRuleResponseDto.fromEntity(rule);
  }

  @Patch(':ruleId')
  @ApiOkResponse({ type: NotificationRuleResponseDto })
  async updateRule(
    @CurrentApp() app: RequestAppContext,
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateNotificationRuleDto,
  ): Promise<NotificationRuleResponseDto> {
    const rule = await this.notificationsService.update(app.appId, ruleId, dto);
    return NotificationRuleResponseDto.fromEntity(rule);
  }
}
