import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { AccountEntity } from './entities/account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity])],
  controllers: [AccountsController],
  providers: [AccountsService, JwtAuthGuard],
  exports: [AccountsService, TypeOrmModule],
})
export class AccountsModule {}
