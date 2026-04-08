import type {
  EventSchemaResponse,
  SchemaField,
  SchemaMetadataField,
} from '@vela-event/sdk';
import { LocalSchema, ChangeSet } from './types.js';

function canonicalize(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj as object).sort());
}

function compareFields(local: SchemaField[], remote: SchemaField[]): string[] {
  const diffs: string[] = [];
  const remoteByName = new Map(remote.map((f) => [f.name, f]));
  const localByName = new Map(local.map((f) => [f.name, f]));

  for (const field of local) {
    const r = remoteByName.get(field.name);
    if (!r) {
      diffs.push(
        `+ field "${field.name}" (${field.type}, ${field.required ? 'required' : 'optional'})`,
      );
    } else if (canonicalize(field) !== canonicalize(r)) {
      diffs.push(`~ field "${field.name}" changed`);
    }
  }

  for (const field of remote) {
    if (!localByName.has(field.name)) {
      diffs.push(`- field "${field.name}" removed`);
    }
  }

  return diffs;
}

function compareMetadataFields(
  local: SchemaMetadataField[] | undefined,
  remote: SchemaMetadataField[],
): string[] {
  const diffs: string[] = [];
  const localFields = local || [];
  const remoteByName = new Map(remote.map((f) => [f.name, f]));
  const localByName = new Map(localFields.map((f) => [f.name, f]));

  for (const field of localFields) {
    const r = remoteByName.get(field.name);
    if (!r) {
      diffs.push(`+ metadata "${field.name}"`);
    } else if (canonicalize(field) !== canonicalize(r)) {
      diffs.push(`~ metadata "${field.name}" changed`);
    }
  }

  for (const field of remote) {
    if (!localByName.has(field.name)) {
      diffs.push(`- metadata "${field.name}" removed`);
    }
  }

  return diffs;
}

export function computeChanges(
  local: LocalSchema[],
  remote: EventSchemaResponse[],
): ChangeSet {
  const remoteByEvent = new Map(remote.map((s) => [s.eventName, s]));
  const changes: ChangeSet = [];

  for (const schema of local) {
    const r = remoteByEvent.get(schema.eventName);

    if (!r) {
      const details = schema.fields.map(
        (f) =>
          `+ field "${f.name}" (${f.type}, ${f.required ? 'required' : 'optional'})`,
      );
      changes.push({
        eventName: schema.eventName,
        type: 'create',
        local: schema,
        remote: null,
        details,
      });
      continue;
    }

    const details: string[] = [];

    if ((schema.description || null) !== (r.description || null)) {
      details.push('~ description changed');
    }

    details.push(...compareFields(schema.fields, r.fields));
    details.push(
      ...compareMetadataFields(schema.metadataFields, r.metadataFields),
    );

    changes.push({
      eventName: schema.eventName,
      type: details.length > 0 ? 'update' : 'no-change',
      local: schema,
      remote: r,
      details,
    });
  }

  return changes;
}
