import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { CliConfig } from '../types.js';

const mockList = jest.fn();

jest.mock('@vela-event/sdk', () => ({
  VelaManagementClient: jest.fn().mockImplementation(() => ({
    forApp: () => ({
      schemas: { list: mockList },
    }),
  })),
}));

import { pull } from '../commands/pull.js';

describe('pull command', () => {
  let tmpDir: string;
  let config: CliConfig;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vela-pull-'));
    config = {
      clientSecret: 'vela_cs_test',
      app: 'my-app',
      schemasDir: path.join(tmpDir, 'schemas'),
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('pulls schemas to local files', async () => {
    mockList.mockResolvedValue([
      {
        id: 'sch_1',
        appId: 'app-1',
        eventName: 'order.placed',
        description: 'An order',
        fields: [{ id: 'f1', name: 'orderId', type: 'string', required: true }],
        metadataFields: [{ id: 'm1', name: 'env', type: 'string' }],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]);

    await pull(config);

    const filePath = path.join(config.schemasDir, 'order.placed.json');
    expect(fs.existsSync(filePath)).toBe(true);

    const written = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(written.eventName).toBe('order.placed');
    expect(written.id).toBeUndefined();
    expect(written.appId).toBeUndefined();
  });

  it('handles empty remote', async () => {
    mockList.mockResolvedValue([]);
    await pull(config);
    expect(fs.existsSync(config.schemasDir)).toBe(false);
  });
});
