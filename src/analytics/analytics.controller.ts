import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiAppIdParam } from '../common/decorators/api-app-id-param.decorator';
import { CurrentApp } from '../common/decorators/current-app.decorator';
import { AppAccessGuard } from '../common/guards/app-access.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { RequestAppContext } from '../common/interfaces/request-context.interface';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { AnalyticsResponseDto } from './dto/analytics-response.dto';
import { DashboardStatsResponseDto } from './dto/dashboard-stats-response.dto';
import { DeliveryMetricsResponseDto } from './dto/delivery-metrics-response.dto';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@ApiAppIdParam()
@ApiExtraModels(AnalyticsQueryDto)
@Controller('apps/:appId/analytics')
@UseGuards(JwtAuthGuard, AppAccessGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  @ApiOkResponse({ type: DashboardStatsResponseDto })
  async getDashboardStats(
    @CurrentApp() app: RequestAppContext,
  ): Promise<DashboardStatsResponseDto> {
    return this.analyticsService.getDashboardStats(app.appId);
  }

  @Get()
  @ApiOkResponse({ type: AnalyticsResponseDto })
  async getAnalytics(
    @CurrentApp() app: RequestAppContext,
    @Query() query: AnalyticsQueryDto,
  ): Promise<AnalyticsResponseDto> {
    return this.analyticsService.getAppAnalytics(
      app.appId,
      query.range ?? '24h',
    );
  }

  @Get('delivery')
  @ApiOkResponse({ type: DeliveryMetricsResponseDto })
  async getDeliveryMetrics(
    @CurrentApp() app: RequestAppContext,
    @Query('range') range = '24h',
  ): Promise<DeliveryMetricsResponseDto> {
    return this.analyticsService.getDeliveryMetrics(app.appId, range);
  }
}
