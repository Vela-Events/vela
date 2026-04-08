import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientSecretEntity } from './entities/client-secret.entity';
import { ClientSecretsService } from './client-secrets.service';
import { ClientSecretsController } from './client-secrets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClientSecretEntity])],
  providers: [ClientSecretsService],
  controllers: [ClientSecretsController],
  exports: [ClientSecretsService],
})
export class ClientSecretsModule {}
