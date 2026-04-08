import { BaseClient, VelaClientOptions } from './base-client.js';
import { VelaAuthError } from '../errors.js';
import { AppsResource } from '../resources/apps.js';
import { SchemasResource } from '../resources/schemas.js';
import { NotificationRulesResource } from '../resources/notification-rules.js';
import { EventsResource } from '../resources/events.js';

export interface AppScopedResources {
  schemas: SchemasResource;
  notificationRules: NotificationRulesResource;
  events: EventsResource;
}

export class VelaManagementClient extends BaseClient {
  readonly apps: AppsResource;

  private _token: string | null;

  /**
   * @param clientSecret - Your client secret from the Vela dashboard (vela_cs_…)
   */
  constructor(clientSecret?: string, options?: VelaClientOptions) {
    super(options);
    this._token = clientSecret ?? null;
    this.apps = new AppsResource(this);
  }

  protected getAuthHeaders(): Record<string, string> {
    if (!this._token) {
      throw new VelaAuthError(
        'No client secret provided. Pass your client secret (vela_cs_…) to the constructor.',
        401,
        'Unauthorized',
        '',
        '',
      );
    }
    return { Authorization: `Bearer ${this._token}` };
  }

  forApp(appId: string): AppScopedResources {
    return {
      schemas: new SchemasResource(this, appId),
      notificationRules: new NotificationRulesResource(this, appId),
      events: new EventsResource(this, appId),
    };
  }
}
