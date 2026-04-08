import { computeChanges } from '../diff-engine.js';
import type { LocalSchema } from '../types.js';
import type { EventSchemaResponse } from '@vela-event/sdk';

const makeRemote = (
  overrides: Partial<EventSchemaResponse> = {},
): EventSchemaResponse => ({
  id: 'sch_1',
  appId: 'app-1',
  eventName: 'order.placed',
  description: 'An order was placed',
  fields: [
    { id: 'f1', name: 'orderId', type: 'string', required: true },
    { id: 'f2', name: 'amountCents', type: 'number', required: true },
  ],
  metadataFields: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const makeLocal = (overrides: Partial<LocalSchema> = {}): LocalSchema => ({
  eventName: 'order.placed',
  description: 'An order was placed',
  fields: [
    { id: 'f1', name: 'orderId', type: 'string', required: true },
    { id: 'f2', name: 'amountCents', type: 'number', required: true },
  ],
  ...overrides,
});

describe('computeChanges', () => {
  it('marks new schemas as create', () => {
    const changes = computeChanges([makeLocal()], []);
    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe('create');
    expect(changes[0].eventName).toBe('order.placed');
    expect(changes[0].details.length).toBeGreaterThan(0);
  });

  it('marks identical schemas as no-change', () => {
    const changes = computeChanges([makeLocal()], [makeRemote()]);
    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe('no-change');
    expect(changes[0].details).toEqual([]);
  });

  it('detects description change', () => {
    const local = makeLocal({ description: 'Updated description' });
    const changes = computeChanges([local], [makeRemote()]);
    expect(changes[0].type).toBe('update');
    expect(changes[0].details).toContain('~ description changed');
  });

  it('detects added field', () => {
    const local = makeLocal({
      fields: [
        { id: 'f1', name: 'orderId', type: 'string', required: true },
        { id: 'f2', name: 'amountCents', type: 'number', required: true },
        {
          id: 'f3',
          name: 'currency',
          type: 'enum',
          required: true,
          enumValues: ['USD'],
        },
      ],
    });
    const changes = computeChanges([local], [makeRemote()]);
    expect(changes[0].type).toBe('update');
    expect(changes[0].details).toContainEqual(
      expect.stringContaining('+ field "currency"'),
    );
  });

  it('detects removed field', () => {
    const local = makeLocal({
      fields: [{ id: 'f1', name: 'orderId', type: 'string', required: true }],
    });
    const changes = computeChanges([local], [makeRemote()]);
    expect(changes[0].type).toBe('update');
    expect(changes[0].details).toContainEqual(
      expect.stringContaining('- field "amountCents" removed'),
    );
  });

  it('detects changed field type', () => {
    const local = makeLocal({
      fields: [
        { id: 'f1', name: 'orderId', type: 'number', required: true },
        { id: 'f2', name: 'amountCents', type: 'number', required: true },
      ],
    });
    const changes = computeChanges([local], [makeRemote()]);
    expect(changes[0].type).toBe('update');
    expect(changes[0].details).toContainEqual(
      expect.stringContaining('~ field "orderId" changed'),
    );
  });

  it('detects metadata field changes', () => {
    const local = makeLocal({
      metadataFields: [{ id: 'meta-env', name: 'environment', type: 'string' }],
    });
    const changes = computeChanges([local], [makeRemote()]);
    expect(changes[0].type).toBe('update');
    expect(changes[0].details).toContainEqual(
      expect.stringContaining('+ metadata "environment"'),
    );
  });

  it('handles multiple schemas with mixed states', () => {
    const locals: LocalSchema[] = [
      makeLocal(),
      makeLocal({
        eventName: 'order.cancelled',
        fields: [{ id: 'f1', name: 'reason', type: 'string', required: true }],
      }),
    ];
    const remotes = [makeRemote()];
    const changes = computeChanges(locals, remotes);
    expect(changes).toHaveLength(2);
    expect(changes[0].type).toBe('no-change');
    expect(changes[1].type).toBe('create');
  });

  it('returns empty for empty inputs', () => {
    expect(computeChanges([], [])).toEqual([]);
  });
});
