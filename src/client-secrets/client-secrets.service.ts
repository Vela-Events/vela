import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientSecretEntity } from './entities/client-secret.entity';
import { createClientSecret } from '../common/utils/crypto.util';

@Injectable()
export class ClientSecretsService {
  constructor(
    @InjectRepository(ClientSecretEntity)
    private readonly repo: Repository<ClientSecretEntity>,
  ) {}

  async create(
    accountId: string,
    label: string,
  ): Promise<{ entity: ClientSecretEntity; plainTextKey: string }> {
    const { plainTextKey, keyHash, keyPrefix } = createClientSecret();

    const entity = this.repo.create({ accountId, label, keyHash, keyPrefix });
    await this.repo.save(entity);

    return { entity, plainTextKey };
  }

  list(accountId: string): Promise<ClientSecretEntity[]> {
    return this.repo.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
    });
  }

  async revoke(accountId: string, secretId: string): Promise<void> {
    const secret = await this.repo.findOne({
      where: { id: secretId, accountId },
    });

    if (!secret) {
      throw new NotFoundException('Client secret not found');
    }

    await this.repo.remove(secret);
  }
}
