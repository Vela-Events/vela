import { BadRequestException, Injectable } from '@nestjs/common';
import { EventSchemaEntity } from './entities/event-schema.entity';

@Injectable()
export class SchemaValidatorService {
  validateEventAgainstSchema(
    schema: EventSchemaEntity,
    payload: Record<string, unknown>,
    metadata: Record<string, unknown>,
  ): void {
    this.validateFieldGroup(
      schema.eventName,
      'payload',
      schema.fields,
      payload,
    );
    this.validateFieldGroup(
      schema.eventName,
      'metadata',
      schema.metadataFields,
      metadata,
    );
  }

  private validateFieldGroup(
    eventName: string,
    label: string,
    definitions: Array<Record<string, unknown>>,
    values: Record<string, unknown>,
  ): void {
    for (const definition of definitions) {
      const fieldName = this.readString(definition.name, 'Schema field name');
      const fieldType = this.readString(definition.type, 'Schema field type');
      const required = definition.required === true;
      const value = values[fieldName];

      if ((value === undefined || value === null) && required) {
        throw new BadRequestException(
          `${eventName}: missing required ${label} field "${fieldName}"`,
        );
      }

      if (value === undefined || value === null) {
        continue;
      }

      if (!this.matchesType(fieldType, value, definition.enumValues)) {
        throw new BadRequestException(
          `${eventName}: ${label} field "${fieldName}" does not match type ${fieldType}`,
        );
      }
    }
  }

  private matchesType(
    type: string,
    value: unknown,
    enumValues: unknown,
  ): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && Number.isFinite(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return (
          (typeof value === 'string' || value instanceof Date) &&
          !Number.isNaN(new Date(value).valueOf())
        );
      case 'enum':
        return Array.isArray(enumValues) && enumValues.includes(value);
      case 'object':
        return (
          typeof value === 'object' && value !== null && !Array.isArray(value)
        );
      default:
        return true;
    }
  }

  private readString(value: unknown, label: string): string {
    if (typeof value !== 'string' || value.length === 0) {
      throw new BadRequestException(
        `${label} is invalid in the stored schema definition`,
      );
    }

    return value;
  }
}
