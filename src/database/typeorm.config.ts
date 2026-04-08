import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function typeOrmModuleOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const databaseUrl = configService.get<string>('database.url', '');
  const logging = configService.get<boolean>('database.logging', true);
  const ssl = configService.get<boolean>('database.ssl', false);
  const synchronize = configService.get<boolean>('database.synchronize', true);

  return {
    type: 'postgres',
    url: databaseUrl,
    autoLoadEntities: true,
    logging,
    synchronize,
    ssl: ssl ? { rejectUnauthorized: false } : false,
  };
}
