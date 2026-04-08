import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL ?? '',
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true',
  /** Prefer migrations; only true for local dev if you accept schema drift risk */
  synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
}));
