import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  appName: process.env.APP_NAME ?? 'vela-be',
  appVersion: process.env.APP_VERSION ?? '0.0.1',
  apiPrefix: process.env.API_PREFIX ?? 'v1',
}));
