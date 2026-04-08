import { BaseClient } from '../client/base-client.js';
import {
  CreateNotificationRuleInput,
  NotificationRuleResponse,
  UpdateNotificationRuleInput,
} from '../types/index.js';

export class NotificationRulesResource {
  constructor(
    private readonly client: BaseClient,
    private readonly appId: string,
  ) {}

  list(): Promise<NotificationRuleResponse[]> {
    return this.client.request<NotificationRuleResponse[]>(
      'GET',
      `/v1/apps/${this.appId}/notification-rules`,
    );
  }

  create(
    input: CreateNotificationRuleInput,
  ): Promise<NotificationRuleResponse> {
    return this.client.request<NotificationRuleResponse>(
      'POST',
      `/v1/apps/${this.appId}/notification-rules`,
      { body: input },
    );
  }

  update(
    ruleId: string,
    input: UpdateNotificationRuleInput,
  ): Promise<NotificationRuleResponse> {
    return this.client.request<NotificationRuleResponse>(
      'PATCH',
      `/v1/apps/${this.appId}/notification-rules/${ruleId}`,
      { body: input },
    );
  }
}
