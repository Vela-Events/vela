import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { CliConfig } from '../types.js';

// Mock the SDK
const mockList = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@vela-event/sdk', () => ({
  VelaManagementClient: jest.fn().mockImplementation(() => ({
    forApp: () => ({
      schemas: { list: mockList, create: mockCreate, update: mockUpdate },
    }),
  })),
  VelaError: class VelaError extends Error {
    statusCode: number;
    constructor(msg: string, status: number) {
      super(msg);
      this.statusCode = status;
    }
  },
}));

import { push } from '../commands/push.js';

describe('push command', () => {
  let tmpDir: string;
  let config: CliConfig;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vela-push-'));
    config = {
      clientSecret: 'vela_cs_test',
      app: 'my-app',
      schemasDir: tmpDir,
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates new schemas', async () => {
    const schema = {
      eventName: 'order.placed',
      fields: [{ id: 'f1', name: 'orderId', type: 'string', required: true }],
    };
    fs.writeFileSync(
      path.join(tmpDir, 'order.placed.json'),
      JSON.stringify(schema),
    );

    mockList.mockResolvedValue([]);
    mockCreate.mockResolvedValue({ ...schema, id: 'sch_1' });

    await push(config);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'order.placed' }),
    );
  });

  it('updates changed schemas', async () => {
    const local = {
      eventName: 'order.placed',
      description: 'Updated',
      fields: [{ id: 'f1', name: 'orderId', type: 'string', required: true }],
    };
    fs.writeFileSync(
      path.join(tmpDir, 'order.placed.json'),
      JSON.stringify(local),
    );

    const remote = {
      id: 'sch_1',
      appId: 'app-1',
      eventName: 'order.placed',
      description: 'Original',
      fields: [{ id: 'f1', name: 'orderId', type: 'string', required: true }],
      metadataFields: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    mockList.mockResolvedValue([remote]);
    mockUpdate.mockResolvedValue({ ...remote, description: 'Updated' });

    await push(config);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      'sch_1',
      expect.objectContaining({ description: 'Updated' }),
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('does nothing when schemas are up to date', async () => {
    const schema = {
      eventName: 'order.placed',
      description: 'Same',
      fields: [{ id: 'f1', name: 'orderId', type: 'string', required: true }],
    };
    fs.writeFileSync(
      path.join(tmpDir, 'order.placed.json'),
      JSON.stringify(schema),
    );

    mockList.mockResolvedValue([
      {
        ...schema,
        id: 'sch_1',
        appId: 'app-1',
        metadataFields: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]);

    await push(config);

    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('does nothing with empty schemas directory', async () => {
    await push(config);
    expect(mockList).not.toHaveBeenCalled();
  });
});
