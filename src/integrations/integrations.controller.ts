import {
  Body,
  Controller,
  Delete,
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
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentApp } from '../common/decorators/current-app.decorator';
import { AppMembershipGuard } from '../common/guards/app-membership.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type {
  RequestAccountContext,
  RequestAppContext,
} from '../common/interfaces/request-context.interface';
import { ConnectionResponseDto } from './dto/connection-response.dto';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { DestinationResponseDto } from './dto/destination-response.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { IntegrationsService } from './integrations.service';

@ApiTags('integrations')
@ApiBearerAuth()
@Controller()
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('integrations/connections')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: [ConnectionResponseDto] })
  async listConnections(
    @CurrentAccount() account: RequestAccountContext,
  ): Promise<ConnectionResponseDto[]> {
    const connections = await this.integrationsService.listConnections(
      account.accountId,
    );
    return connections.map((connection) =>
      ConnectionResponseDto.fromEntity(connection),
    );
  }

  @Post('integrations/connections')
  @UseGuards(JwtAuthGuard)
  @ApiCreatedResponse({ type: ConnectionResponseDto })
  async createConnection(
    @CurrentAccount() account: RequestAccountContext,
    @Body() dto: CreateConnectionDto,
  ): Promise<ConnectionResponseDto> {
    const connection = await this.integrationsService.createConnection(
      account.accountId,
      dto,
    );
    return ConnectionResponseDto.fromEntity(connection);
  }

  @Delete('integrations/connections/:connectionId')
  @UseGuards(JwtAuthGuard)
  async deleteConnection(
    @CurrentAccount() account: RequestAccountContext,
    @Param('connectionId') connectionId: string,
  ): Promise<{ deleted: true }> {
    await this.integrationsService.deleteConnection(
      account.accountId,
      connectionId,
    );
    return { deleted: true };
  }

  @Get('apps/:appId/notification-destinations')
  @ApiAppIdParam()
  @UseGuards(JwtAuthGuard, AppMembershipGuard)
  @ApiOkResponse({ type: [DestinationResponseDto] })
  async listDestinations(
    @CurrentApp() app: RequestAppContext,
  ): Promise<DestinationResponseDto[]> {
    const destinations = await this.integrationsService.listDestinations(
      app.appId,
    );
    return destinations.map((destination) =>
      DestinationResponseDto.fromEntity(destination),
    );
  }

  @Post('apps/:appId/notification-destinations')
  @ApiAppIdParam()
  @UseGuards(JwtAuthGuard, AppMembershipGuard)
  @ApiCreatedResponse({ type: DestinationResponseDto })
  async createDestination(
    @CurrentApp() app: RequestAppContext,
    @Body() dto: CreateDestinationDto,
  ): Promise<DestinationResponseDto> {
    const destination = await this.integrationsService.createDestination(
      app.appId,
      dto,
    );
    return DestinationResponseDto.fromEntity(destination);
  }

  @Patch('apps/:appId/notification-destinations/:destinationId')
  @ApiAppIdParam()
  @UseGuards(JwtAuthGuard, AppMembershipGuard)
  @ApiOkResponse({ type: DestinationResponseDto })
  async updateDestination(
    @CurrentApp() app: RequestAppContext,
    @Param('destinationId') destinationId: string,
    @Body() dto: UpdateDestinationDto,
  ): Promise<DestinationResponseDto> {
    const destination = await this.integrationsService.updateDestination(
      app.appId,
      destinationId,
      dto,
    );
    return DestinationResponseDto.fromEntity(destination);
  }

  @Post('apps/:appId/notification-destinations/:destinationId/test')
  @ApiAppIdParam()
  @UseGuards(JwtAuthGuard, AppMembershipGuard)
  async testDestination(
    @CurrentApp() app: RequestAppContext,
    @Param('destinationId') destinationId: string,
  ): Promise<{ status: string; message: string }> {
    return this.integrationsService.testDestination(app.appId, destinationId);
  }
}
