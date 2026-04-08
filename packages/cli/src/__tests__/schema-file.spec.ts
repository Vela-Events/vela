import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { readLocalSchemas, writeLocalSchema } from '../schema-file.js';
import type { EventSchemaResponse } from '@vela-event/sdk';

describe('readLocalSchemas', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vela-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty array for nonexistent directory', () => {
    expect(readLocalSchemas('/tmp/does-not-exist-xyz')).toEqual([]);
  });

  it('reads valid JSON schema files', () => {
    const schema = {
      eventName: 'order.placed',
      fields: [{ id: 'f1', name: 'orderId', type: 'string', required: true }],
    };
    fs.writeFileSync(
      path.join(tmpDir, 'order.placed.json'),
      JSON.stringify(schema),
    );

    const result = readLocalSchemas(tmpDir);
    expect(result).toHaveLength(1);
    expect(result[0].eventName).toBe('order.placed');
  });

  it('skips files missing eventName', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'bad.json'),
      JSON.stringify({ fields: [] }),
    );
    expect(readLocalSchemas(tmpDir)).toEqual([]);
  });

  it('skips files with invalid JSON', () => {
    fs.writeFileSync(path.join(tmpDir, 'bad.json'), '{ broken }');
    expect(readLocalSchemas(tmpDir)).toEqual([]);
  });

  it('ignores non-JSON files', () => {
    fs.writeFileSync(path.join(tmpDir, 'readme.md'), '# hello');
    expect(readLocalSchemas(tmpDir)).toEqual([]);
  });

  it('sorts schemas by eventName', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'z.json'),
      JSON.stringify({
        eventName: 'z.event',
        fields: [{ id: 'f1', name: 'a', type: 'string', required: true }],
      }),
    );
    fs.writeFileSync(
      path.join(tmpDir, 'a.json'),
      JSON.stringify({
        eventName: 'a.event',
        fields: [{ id: 'f1', name: 'a', type: 'string', required: true }],
      }),
    );
    const result = readLocalSchemas(tmpDir);
    expect(result[0].eventName).toBe('a.event');
    expect(result[1].eventName).toBe('z.event');
  });
});

describe('writeLocalSchema', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vela-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes schema to JSON file', () => {
    const remote: EventSchemaResponse = {
      id: 'sch_1',
      appId: 'app-1',
      eventName: 'order.placed',
      description: 'Test',
      fields: [{ id: 'f1', name: 'orderId', type: 'string', required: true }],
      metadataFields: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    writeLocalSchema(tmpDir, remote);

    const filePath = path.join(tmpDir, 'order.placed.json');
    expect(fs.existsSync(filePath)).toBe(true);

    const written = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(written.eventName).toBe('order.placed');
    expect(written.description).toBe('Test');
    expect(written.fields).toHaveLength(1);
    // Server-only fields should be stripped
    expect(written.id).toBeUndefined();
    expect(written.appId).toBeUndefined();
    expect(written.createdAt).toBeUndefined();
    expect(written.updatedAt).toBeUndefined();
  });

  it('omits empty metadataFields', () => {
    const remote: EventSchemaResponse = {
      id: 'sch_1',
      appId: 'app-1',
      eventName: 'test.event',
      description: null,
      fields: [{ id: 'f1', name: 'a', type: 'string', required: true }],
      metadataFields: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    writeLocalSchema(tmpDir, remote);
    const written = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'test.event.json'), 'utf-8'),
    );
    expect(written.metadataFields).toBeUndefined();
    expect(written.description).toBeUndefined();
  });

  it('creates directory if it does not exist', () => {
    const nested = path.join(tmpDir, 'nested', 'schemas');
    const remote: EventSchemaResponse = {
      id: 'sch_1',
      appId: 'app-1',
      eventName: 'test.event',
      description: null,
      fields: [{ id: 'f1', name: 'a', type: 'string', required: true }],
      metadataFields: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    writeLocalSchema(nested, remote);
    expect(fs.existsSync(path.join(nested, 'test.event.json'))).toBe(true);
  });
});
