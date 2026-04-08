export interface RequestAccountContext {
  accountId: string;
  email: string;
  name?: string;
}

export interface RequestAppContext {
  appId: string;
  slug: string;
}

export interface AuthenticatedRequest {
  user?: RequestAccountContext;
  /** Vela app scope (do not use `app` — that is Express's Application on IncomingMessage). */
  appContext?: RequestAppContext;
  headers: Record<string, string | string[] | undefined>;
  params?: Record<string, string | undefined>;
}
