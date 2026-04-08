import 'reflect-metadata';
import { DataSource } from 'typeorm';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set to run TypeORM CLI commands.');
}

const isProd = process.env.NODE_ENV === 'production';

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: isProd ? ['dist/**/*.entity.js'] : ['src/**/*.entity.ts'],
  migrations: isProd
    ? ['dist/database/migrations/*.js']
    : ['src/database/migrations/*.ts'],
  synchronize: false,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
