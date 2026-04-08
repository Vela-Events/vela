import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from '../accounts/entities/account.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AppsController } from './apps.controller';
import { AppsService } from './apps.service';
import { AppEntity } from './entities/app.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AppEntity, AccountEntity])],
  controllers: [AppsController],
  providers: [AppsService, JwtAuthGuard],
  exports: [AppsService, TypeOrmModule],
})
export class AppsModule {}
