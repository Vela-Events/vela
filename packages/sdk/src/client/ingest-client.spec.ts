import { VelaIngestClient } from './ingest-client.js';
import {
  VelaAuthError,
  VelaNotFoundError,
  VelaValidationError,
} from '../errors.js';

function makeFetch(status: number, body: unknown): jest.Mock {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

const MOCK_INGEST_RESPONSE = {
  accepted: 1,
  events: [
    {
      id: 'evt-1',
      appId: 'app-1',
      event: 'order.placed',
      customer_id: null,
      data: { orderId: '1' },
      level: 'info',
      metadata: {},
      timestamp: '2024-01-01T00:00:00.000Z',
      ingestedAt: '2024-01-01T00:00:01.000Z',
    },
  ],
};

describe('VelaIngestClient', () => {
  describe('ingest (single event)', () => {
    it('sends a single event as a flat body and returns IngestResponse', async () => {
      const mockFetch = makeFetch(201, MOCK_INGEST_RESPONSE);
      const client = new VelaIngestClient('vela_live_test', {
        fetchImpl: mockFetch,
      });

      const result = await client.ingest({
        event: 'order.placed',
        data: { orderId: '1' },
        level: 'info',
      });

      expect(result.accepted).toBe(1);
      expect(result.events).toHaveLength(1);

      const [call] = mockFetch.mock.calls;
      const [url, init] = call;
      expect(url).toContain('/v1/ingest');
      expect(init.method).toBe('POST');
      expect(init.headers['x-api-key']).toBe('vela_live_test');

      const sentBody = JSON.parse(init.body as string);
      expect(sentBody.event).toBe('order.placed');
      expect(sentBody.events).toBeUndefined();
    });
  });

  describe('ingest (batch)', () => {
    it('sends an array as { events: [...] } body', async () => {
      const batchResponse = { accepted: 2, events: [] };
      const mockFetch = makeFetch(201, batchResponse);
      const client = new VelaIngestClient('vela_live_test', {
        fetchImpl: mockFetch,
      });

      const result = await client.ingest([
        { event: 'order.placed', data: {}, level: 'info' },
        { event: 'order.paid', data: {}, level: 'success' },
      ]);

      expect(result.accepted).toBe(2);

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(Array.isArray(sentBody.events)).toBe(true);
      expect(sentBody.events).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('throws VelaValidationError on 400', async () => {
      const mockFetch = makeFetch(400, {
        statusCode: 400,
        message: 'Bad request',
        error: 'Bad Request',
        path: '/v1/ingest',
        timestamp: '',
      });
      const client = new VelaIngestClient('key', { fetchImpl: mockFetch });
      await expect(
        client.ingest({ event: 'x', data: {}, level: 'info' }),
      ).rejects.toBeInstanceOf(VelaValidationError);
    });

    it('throws VelaAuthError on 401', async () => {
      const mockFetch = makeFetch(401, {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
        path: '/v1/ingest',
        timestamp: '',
      });
      const client = new VelaIngestClient('bad-key', { fetchImpl: mockFetch });
      await expect(
        client.ingest({ event: 'x', data: {}, level: 'info' }),
      ).rejects.toBeInstanceOf(VelaAuthError);
    });

    it('throws VelaNotFoundError on 404', async () => {
      const mockFetch = makeFetch(404, {
        statusCode: 404,
        message: 'Not found',
        error: 'Not Found',
        path: '/v1/ingest',
        timestamp: '',
      });
      const client = new VelaIngestClient('key', { fetchImpl: mockFetch });
      await expect(
        client.ingest({ event: 'x', data: {}, level: 'info' }),
      ).rejects.toBeInstanceOf(VelaNotFoundError);
    });
  });

  describe('auth header', () => {
    it('always sends x-api-key header', async () => {
      const mockFetch = makeFetch(201, { accepted: 0, events: [] });
      const client = new VelaIngestClient('my-key-123', {
        fetchImpl: mockFetch,
      });
      await client.ingest({ event: 'x', data: {}, level: 'info' });
      expect(mockFetch.mock.calls[0][1].headers['x-api-key']).toBe(
        'my-key-123',
      );
    });
  });

  describe('optional fields', () => {
    it('includes customer_id, metadata, and timestamp when provided', async () => {
      const mockFetch = makeFetch(201, { accepted: 1, events: [] });
      const client = new VelaIngestClient('key', { fetchImpl: mockFetch });
      await client.ingest({
        event: 'order.placed',
        data: {},
        level: 'info',
        customer_id: 'cust-1',
        metadata: { env: 'prod' },
        timestamp: '2024-01-01T00:00:00.000Z',
      });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.customer_id).toBe('cust-1');
      expect(body.metadata).toEqual({ env: 'prod' });
      expect(body.timestamp).toBe('2024-01-01T00:00:00.000Z');
    });
  });
});
