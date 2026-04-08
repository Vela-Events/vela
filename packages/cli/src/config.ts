import * as fs from 'fs';
import * as path from 'path';
import { CliConfig } from './types.js';
import { error } from './logger.js';

const CONFIG_FILE = 'vela.config.json';
const DEFAULT_SCHEMAS_DIR = './vela/schemas';

interface RawConfig {
  clientSecret?: string;
  app?: string;
  schemasDir?: string;
  baseUrl?: string;
}

export function loadConfig(
  overrides: { app?: string; dir?: string; baseUrl?: string } = {},
): CliConfig {
  const configPath = path.resolve(process.cwd(), CONFIG_FILE);

  let raw: RawConfig = {};
  if (fs.existsSync(configPath)) {
    try {
      raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {
      error(`Failed to parse ${CONFIG_FILE}`);
      process.exit(1);
    }
  }

  const clientSecret = process.env.VELA_CLIENT_SECRET || raw.clientSecret;
  const app = overrides.app || raw.app;
  const schemasDir = overrides.dir || raw.schemasDir || DEFAULT_SCHEMAS_DIR;
  const baseUrl = overrides.baseUrl || process.env.VELA_BASE_URL || raw.baseUrl;

  if (!clientSecret) {
    error(
      'Missing client secret. Set VELA_CLIENT_SECRET or add "clientSecret" to vela.config.json',
    );
    process.exit(1);
  }

  if (!app) {
    error('Missing app. Add "app" to vela.config.json or pass --app <slug>');
    process.exit(1);
  }

  return {
    clientSecret,
    app,
    schemasDir: path.resolve(process.cwd(), schemasDir),
    baseUrl,
  };
}
