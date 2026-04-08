import * as fs from 'fs';
import * as path from 'path';
import type { EventSchemaResponse } from '@vela-event/sdk';
import { LocalSchema } from './types.js';
import { warn } from './logger.js';

export function readLocalSchemas(schemasDir: string): LocalSchema[] {
  if (!fs.existsSync(schemasDir)) {
    return [];
  }

  const files = fs
    .readdirSync(schemasDir)
    .filter((f) => f.endsWith('.json'))
    .sort();
  const schemas: LocalSchema[] = [];

  for (const file of files) {
    const filePath = path.join(schemasDir, file);
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (!raw.eventName || !Array.isArray(raw.fields)) {
        warn(`Skipping ${file}: missing eventName or fields`);
        continue;
      }
      schemas.push(raw as LocalSchema);
    } catch {
      warn(`Skipping ${file}: invalid JSON`);
    }
  }

  return schemas.sort((a, b) => a.eventName.localeCompare(b.eventName));
}

export function writeLocalSchema(
  schemasDir: string,
  schema: EventSchemaResponse,
): void {
  fs.mkdirSync(schemasDir, { recursive: true });

  const local: LocalSchema = {
    eventName: schema.eventName,
    ...(schema.description ? { description: schema.description } : {}),
    fields: schema.fields,
    ...(schema.metadataFields?.length
      ? { metadataFields: schema.metadataFields }
      : {}),
  };

  const filePath = path.join(schemasDir, `${schema.eventName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(local, null, 2) + '\n', 'utf-8');
}
