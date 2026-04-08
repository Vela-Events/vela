import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import type { RequestAccountContext } from '../common/interfaces/request-context.interface';
import { ClientSecretsService } from './client-secrets.service';
import { CreateClientSecretDto } from './dto/create-client-secret.dto';
import {
  ClientSecretResponseDto,
  ClientSecretWithKeyResponseDto,
} from './dto/client-secret-response.dto';

@ApiTags('Client Secrets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/client-secrets')
export class ClientSecretsController {
  constructor(private readonly service: ClientSecretsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all client secrets for the authenticated account',
  })
  async list(
    @CurrentAccount() account: RequestAccountContext,
  ): Promise<ClientSecretResponseDto[]> {
    const secrets = await this.service.list(account.accountId);
    return secrets.map((s) => ClientSecretResponseDto.fromEntity(s));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new client secret' })
  async create(
    @CurrentAccount() account: RequestAccountContext,
    @Body() dto: CreateClientSecretDto,
  ): Promise<ClientSecretWithKeyResponseDto> {
    const { entity, plainTextKey } = await this.service.create(
      account.accountId,
      dto.label,
    );
    return ClientSecretWithKeyResponseDto.fromEntityWithKey(
      entity,
      plainTextKey,
    );
  }

  @Delete(':secretId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a client secret' })
  async revoke(
    @CurrentAccount() account: RequestAccountContext,
    @Param('secretId', ParseUUIDPipe) secretId: string,
  ): Promise<void> {
    await this.service.revoke(account.accountId, secretId);
  }
}
