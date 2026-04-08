import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { RequestAccountContext } from '../common/interfaces/request-context.interface';
import { AccountResponseDto } from './dto/account-response.dto';
import { AccountsService } from './accounts.service';

@ApiTags('accounts')
@ApiBearerAuth()
@Controller('me')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOkResponse({ type: AccountResponseDto })
  async getMe(
    @CurrentAccount() account: RequestAccountContext,
  ): Promise<AccountResponseDto> {
    const entity = await this.accountsService.getCurrentAccount(account);
    return AccountResponseDto.fromEntity(entity);
  }
}
