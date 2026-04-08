import { VelaAuthError, VelaNotFoundError } from '../errors.js';
import { VelaManagementClient } from './management-client.js';

function makeFetch(status: number, body: unknown): jest.Mock {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

const MOCK_APP = {
  id: 'app-1',
  accountId: 'acc-1',
  name: 'Test App',
  slug: 'test-app',
  apiKeyPrefix: 'vela_live_abc',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('VelaManagementClient', () => {
  describe('authentication', () => {
    it('throws VelaAuthError when no client secret provided', async () => {
      const client = new VelaManagementClient();
      await expect(client.apps.list()).rejects.toBeInstanceOf(VelaAuthError);
    });

    it('sends client secret as Bearer token', async () => {
      const mockFetch = makeFetch(200, [MOCK_APP]);
      const client = new VelaManagementClient('vela_cs_testsecret', {
        fetchImpl: mockFetch,
      });

      await client.apps.list();

      const authHeader = mockFetch.mock.calls[0][1].headers['Authorization'];
      expect(authHeader).toBe('Bearer vela_cs_testsecret');
    });
  });

  describe('apps resource', () => {
    it('list() calls GET /v1/apps', async () => {
      const mockFetch = makeFetch(200, [MOCK_APP]);
      const client = new VelaManagementClient('vela_cs_test', {
        fetchImpl: mockFetch,
      });

      const result = await client.apps.list();
      expect(result).toHaveLength(1);
      expect(mockFetch.mock.calls[0][0]).toContain('/v1/apps');
      expect(mockFetch.mock.calls[0][1].method).toBe('GET');
    });

    it('create() calls POST /v1/apps', async () => {
      const mockFetch = makeFetch(201, {
        app: MOCK_APP,
        apiKey: 'vela_live_xxx',
      });
      const client = new VelaManagementClient('vela_cs_test', {
        fetchImpl: mockFetch,
      });

      const result = await client.apps.create({ name: 'Test App' });
      expect(result.apiKey).toBe('vela_live_xxx');
      expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    });

    it('rotateKey() calls POST /v1/apps/:appId/keys/rotate', async () => {
      const mockFetch = makeFetch(200, {
        app: MOCK_APP,
        apiKey: 'vela_live_new',
      });
      const client = new VelaManagementClient('vela_cs_test', {
        fetchImpl: mockFetch,
      });

      await client.apps.rotateKey('app-1');
      expect(mockFetch.mock.calls[0][0]).toContain('/keys/rotate');
    });
  });

  describe('forApp()', () => {
    it('returns schemas, notificationRules, events resources scoped to appId', () => {
      const client = new VelaManagementClient('vela_cs_test');
      const appRes = client.forApp('my-app-slug');

      expect(appRes.schemas).toBeDefined();
      expect(appRes.notificationRules).toBeDefined();
      expect(appRes.events).toBeDefined();
    });

    it('schemas.list() calls correct URL', async () => {
      const mockFetch = makeFetch(200, []);
      const client = new VelaManagementClient('vela_cs_test', {
        fetchImpl: mockFetch,
      });

      await client.forApp('my-app').schemas.list();
      expect(mockFetch.mock.calls[0][0]).toContain('/v1/apps/my-app/schemas');
    });

    it('notificationRules.create() calls correct URL', async () => {
      const mockFetch = makeFetch(201, {
        id: 'rule-1',
        appId: 'my-app',
        name: 'Test',
        eventName: 'x',
        conditions: [],
        actions: [],
        enabled: true,
        lastTriggeredAt: null,
        triggerCount: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      const client = new VelaManagementClient('vela_cs_test', {
        fetchImpl: mockFetch,
      });

      await client.forApp('my-app').notificationRules.create({
        name: 'Test',
        eventName: 'x',
        conditions: [],
        actions: [],
      });
      expect(mockFetch.mock.calls[0][0]).toContain(
        '/v1/apps/my-app/notification-rules',
      );
      expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    });

    it('events.list() passes query params', async () => {
      const mockFetch = makeFetch(200, { items: [], nextCursor: null });
      const client = new VelaManagementClient('vela_cs_test', {
        fetchImpl: mockFetch,
      });

      await client.forApp('my-app').events.list({ level: 'error', limit: 10 });
      const url: string = mockFetch.mock.calls[0][0];
      expect(url).toContain('level=error');
      expect(url).toContain('limit=10');
    });
  });

  describe('error propagation', () => {
    it('throws VelaNotFoundError on 404', async () => {
      const mockFetch = makeFetch(404, {
        statusCode: 404,
        message: 'App not found',
        error: 'Not Found',
        path: '/v1/apps/x',
        timestamp: '',
      });
      const client = new VelaManagementClient('vela_cs_test', {
        fetchImpl: mockFetch,
      });
      await expect(client.apps.get('nonexistent')).rejects.toBeInstanceOf(
        VelaNotFoundError,
      );
    });
  });
});
