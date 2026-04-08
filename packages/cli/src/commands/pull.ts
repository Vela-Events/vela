import { VelaManagementClient } from '@vela-event/sdk';
import { CliConfig } from '../types.js';
import { writeLocalSchema } from '../schema-file.js';
import { info, success } from '../logger.js';

export async function pull(config: CliConfig): Promise<void> {
  const client = new VelaManagementClient(config.clientSecret, {
    baseUrl: config.baseUrl,
  });
  const appRes = client.forApp(config.app);

  const schemas = await appRes.schemas.list();

  if (schemas.length === 0) {
    info('No schemas found on remote.');
    return;
  }

  for (const schema of schemas) {
    writeLocalSchema(config.schemasDir, schema);
    success(`Pulled ${schema.eventName}`);
  }

  console.log();
  info(`Pulled ${schemas.length} schema(s) to ${config.schemasDir}`);
}
