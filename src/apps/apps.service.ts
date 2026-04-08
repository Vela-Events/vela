import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ownedAppWhere } from '../common/utils/app-lookup.util';
import { createApiKey, verifyApiKey } from '../common/utils/crypto.util';
import { slugifyAppName } from '../common/utils/slug.util';
import { AccountEntity } from '../accounts/entities/account.entity';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { AppEntity } from './entities/app.entity';

@Injectable()
export class AppsService {
  constructor(
    @InjectRepository(AppEntity)
    private readonly appsRepository: Repository<AppEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountsRepository: Repository<AccountEntity>,
  ) {}

  async listForAccount(accountId: string): Promise<AppEntity[]> {
    return this.appsRepository.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    accountId: string,
    dto: CreateAppDto,
  ): Promise<{ app: AppEntity; apiKey: string }> {
    const account = await this.accountsRepository.findOne({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const currentAppCount = await this.appsRepository.count({
      where: { accountId },
    });
    const hasLimit = account.appsLimit !== 0;

    if (hasLimit && currentAppCount >= account.appsLimit) {
      throw new ForbiddenException('App limit reached for this account');
    }

    const slugBase = dto.slug ?? slugifyAppName(dto.name);
    const slug = await this.ensureUniqueSlug(slugBase);
    const generatedKey = createApiKey();
    const app = this.appsRepository.create({
      accountId,
      name: dto.name,
      slug,
      apiKeyHash: generatedKey.keyHash,
      apiKeyPrefix: generatedKey.keyPrefix,
    });

    const saved = await this.appsRepository.save(app);
    return { app: saved, apiKey: generatedKey.plainTextKey };
  }

  async findOwnedApp(
    accountId: string,
    appIdOrSlug: string,
  ): Promise<AppEntity> {
    const app = await this.appsRepository.findOne({
      where: ownedAppWhere(accountId, appIdOrSlug),
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    return app;
  }

  async update(
    accountId: string,
    appIdOrSlug: string,
    dto: UpdateAppDto,
  ): Promise<AppEntity> {
    const app = await this.findOwnedApp(accountId, appIdOrSlug);

    if (dto.name) {
      app.name = dto.name;
    }

    if (dto.slug && dto.slug !== app.slug) {
      app.slug = await this.ensureUniqueSlug(dto.slug, app.id);
    }

    return this.appsRepository.save(app);
  }

  async rotateKey(
    accountId: string,
    appIdOrSlug: string,
  ): Promise<{ app: AppEntity; apiKey: string }> {
    const app = await this.findOwnedApp(accountId, appIdOrSlug);
    const generatedKey = createApiKey();

    app.apiKeyHash = generatedKey.keyHash;
    app.apiKeyPrefix = generatedKey.keyPrefix;

    const saved = await this.appsRepository.save(app);
    return { app: saved, apiKey: generatedKey.plainTextKey };
  }

  async authenticateApiKey(apiKey: string): Promise<AppEntity> {
    const prefixParts = apiKey.split('_');

    if (prefixParts.length < 3) {
      throw new ForbiddenException('Invalid API key format');
    }

    const keyPrefix =
      prefixParts.slice(0, 2).join('_') + `_${prefixParts[2].slice(0, 8)}`;
    const candidates = await this.appsRepository.find({
      where: { apiKeyPrefix: keyPrefix },
    });
    const match = candidates.find((candidate) =>
      verifyApiKey(apiKey, candidate.apiKeyHash),
    );

    if (!match) {
      throw new ForbiddenException('Invalid API key');
    }

    return match;
  }

  private async ensureUniqueSlug(
    rawSlug: string,
    ignoreAppId?: string,
  ): Promise<string> {
    const normalized = slugifyAppName(rawSlug);

    if (!normalized) {
      throw new ConflictException('App slug cannot be empty');
    }

    let slug = normalized;
    let suffix = 1;

    while (true) {
      const existing = await this.appsRepository.findOne({
        where: { slug },
      });

      if (!existing || existing.id === ignoreAppId) {
        return slug;
      }

      suffix += 1;
      slug = `${normalized}-${suffix}`;
    }
  }
}
