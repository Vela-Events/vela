import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '../common/enums/domain.enums';
import { RequestAccountContext } from '../common/interfaces/request-context.interface';
import { AccountEntity } from './entities/account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountsRepository: Repository<AccountEntity>,
  ) {}

  async ensureAccount(email: string, name?: string): Promise<AccountEntity> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.accountsRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existing) {
      if (name && existing.name !== name) {
        existing.name = name;
        return this.accountsRepository.save(existing);
      }

      return existing;
    }

    const account = this.accountsRepository.create({
      email: normalizedEmail,
      name: name ?? normalizedEmail.split('@')[0] ?? 'vela-user',
      plan: Plan.FREE,
      appsLimit: 3,
    });

    return this.accountsRepository.save(account);
  }

  async getCurrentAccount(
    context: RequestAccountContext,
  ): Promise<AccountEntity> {
    return this.ensureAccount(context.email, context.name);
  }
}
