import { VelaManagementClient, VelaError } from '@vela-event/sdk';
import { CliConfig } from '../types.js';
import { readLocalSchemas } from '../schema-file.js';
import { computeChanges } from '../diff-engine.js';
import { info, success, error, detail } from '../logger.js';

export async function push(config: CliConfig): Promise<void> {
  const local = readLocalSchemas(config.schemasDir);
  info(`Found ${local.length} local schema(s) in ${config.schemasDir}`);

  if (local.length === 0) {
    info('Nothing to push.');
    return;
  }

  const client = new VelaManagementClient(config.clientSecret, {
    baseUrl: config.baseUrl,
  });
  const appRes = client.forApp(config.app);
  const remote = await appRes.schemas.list();
  const changes = computeChanges(local, remote);

  const pending = changes.filter((c) => c.type !== 'no-change');
  if (pending.length === 0) {
    success('All schemas up to date.');
    return;
  }

  let created = 0;
  let updated = 0;

  for (const entry of pending) {
    try {
      if (entry.type === 'create') {
        await appRes.schemas.create({
          eventName: entry.local.eventName,
          description: entry.local.description,
          fields: entry.local.fields,
          metadataFields: entry.local.metadataFields,
        });
        created++;
        success(`Created ${entry.eventName}`);
      } else if (entry.type === 'update' && entry.remote) {
        await appRes.schemas.update(entry.remote.id, {
          description: entry.local.description,
          fields: entry.local.fields,
          metadataFields: entry.local.metadataFields,
        });
        updated++;
        success(`Updated ${entry.eventName}`);
        for (const d of entry.details) detail(d);
      }
    } catch (err) {
      if (err instanceof VelaError) {
        error(`Failed ${entry.eventName}: ${err.message}`);
      } else {
        throw err;
      }
    }
  }

  const unchanged = changes.length - created - updated;
  console.log();
  info(`Created ${created}, Updated ${updated}, Unchanged ${unchanged}`);
}
