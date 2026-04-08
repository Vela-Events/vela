import { VelaManagementClient } from '@vela-event/sdk';
import { CliConfig } from '../types.js';
import { readLocalSchemas } from '../schema-file.js';
import { computeChanges } from '../diff-engine.js';
import { info, success, warn, detail } from '../logger.js';

export async function diff(config: CliConfig): Promise<void> {
  const local = readLocalSchemas(config.schemasDir);
  info(`Found ${local.length} local schema(s) in ${config.schemasDir}`);

  const client = new VelaManagementClient(config.clientSecret, {
    baseUrl: config.baseUrl,
  });
  const appRes = client.forApp(config.app);
  const remote = await appRes.schemas.list();
  const changes = computeChanges(local, remote);

  let creates = 0;
  let updates = 0;
  let unchanged = 0;

  for (const entry of changes) {
    if (entry.type === 'create') {
      creates++;
      warn(`${entry.eventName}  → create`);
      for (const d of entry.details) detail(d);
    } else if (entry.type === 'update') {
      updates++;
      warn(`${entry.eventName}  → update`);
      for (const d of entry.details) detail(d);
    } else {
      unchanged++;
      success(`${entry.eventName}  → no change`);
    }
  }

  console.log();
  info(`${creates} to create, ${updates} to update, ${unchanged} unchanged`);

  if (creates > 0 || updates > 0) {
    process.exitCode = 1;
  }
}
