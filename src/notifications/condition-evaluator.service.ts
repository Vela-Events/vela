import { Injectable } from '@nestjs/common';

@Injectable()
export class ConditionEvaluatorService {
  matches(
    conditions: Array<Record<string, unknown>>,
    payload: Record<string, unknown>,
    metadata: Record<string, unknown>,
  ): boolean {
    return conditions.every((condition) => {
      const field = this.toComparableString(condition.field) ?? '';
      const operator = this.toComparableString(condition.operator) ?? 'equals';
      const expected = condition.value;
      const actual = this.resolveField(field, payload, metadata);

      switch (operator) {
        case 'equals':
          return actual === expected;
        case 'not_equals':
          return actual !== expected;
        case 'greater_than':
          return Number(actual) > Number(expected);
        case 'less_than':
          return Number(actual) < Number(expected);
        case 'contains':
          return (
            this.toComparableString(actual)?.includes(
              this.toComparableString(expected) ?? '',
            ) ?? false
          );
        case 'starts_with':
          return (
            this.toComparableString(actual)?.startsWith(
              this.toComparableString(expected) ?? '',
            ) ?? false
          );
        default:
          return false;
      }
    });
  }

  private resolveField(
    field: string,
    payload: Record<string, unknown>,
    metadata: Record<string, unknown>,
  ): unknown {
    const [root, ...path] = field.split('.');
    let current: unknown = root === 'metadata' ? metadata : payload;
    const segments =
      root === 'metadata' || root === 'payload' ? path : [root, ...path];

    for (const segment of segments) {
      if (!current || typeof current !== 'object') {
        return undefined;
      }

      current = (current as Record<string, unknown>)[segment];
    }

    return current;
  }

  private toComparableString(value: unknown): string | null {
    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return null;
  }
}
