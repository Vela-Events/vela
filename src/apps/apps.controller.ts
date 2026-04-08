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
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { RequestAccountContext } from '../common/interfaces/request-context.interface';
import { CreateAppDto } from './dto/create-app.dto';
import { AppResponseDto } from './dto/app-response.dto';
import { AppWithKeyResponseDto } from './dto/app-with-key-response.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { AppsService } from './apps.service';

@ApiTags('apps')
@ApiBearerAuth()
@Controller('apps')
@UseGuards(JwtAuthGuard)
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @Get()
  @ApiOkResponse({ type: [AppResponseDto] })
  async listApps(
    @CurrentAccount() account: RequestAccountContext,
  ): Promise<AppResponseDto[]> {
    const apps = await this.appsService.listForAccount(account.accountId);
    return apps.map((app) => AppResponseDto.fromEntity(app));
  }

  @Post()
  @ApiCreatedResponse({ type: AppWithKeyResponseDto })
  async createApp(
    @CurrentAccount() account: RequestAccountContext,
    @Body() dto: CreateAppDto,
  ): Promise<AppWithKeyResponseDto> {
    const result = await this.appsService.create(account.accountId, dto);
    return {
      app: AppResponseDto.fromEntity(result.app),
      apiKey: result.apiKey,
    };
  }

  @Get(':appId')
  @ApiParam({
    name: 'appId',
    description: 'App id (UUID) or slug (unique across all apps)',
  })
  @ApiOkResponse({ type: AppResponseDto })
  async getApp(
    @CurrentAccount() account: RequestAccountContext,
    @Param('appId') appId: string,
  ): Promise<AppResponseDto> {
    const app = await this.appsService.findOwnedApp(account.accountId, appId);
    return AppResponseDto.fromEntity(app);
  }

  @Patch(':appId')
  @ApiParam({
    name: 'appId',
    description: 'App id (UUID) or slug (unique across all apps)',
  })
  @ApiOkResponse({ type: AppResponseDto })
  async updateApp(
    @CurrentAccount() account: RequestAccountContext,
    @Param('appId') appId: string,
    @Body() dto: UpdateAppDto,
  ): Promise<AppResponseDto> {
    const app = await this.appsService.update(account.accountId, appId, dto);
    return AppResponseDto.fromEntity(app);
  }

  @Post(':appId/keys/rotate')
  @ApiParam({
    name: 'appId',
    description: 'App id (UUID) or slug (unique across all apps)',
  })
  @ApiCreatedResponse({ type: AppWithKeyResponseDto })
  async rotateKey(
    @CurrentAccount() account: RequestAccountContext,
    @Param('appId') appId: string,
  ): Promise<AppWithKeyResponseDto> {
    const result = await this.appsService.rotateKey(account.accountId, appId);
    return {
      app: AppResponseDto.fromEntity(result.app),
      apiKey: result.apiKey,
    };
  }
}
