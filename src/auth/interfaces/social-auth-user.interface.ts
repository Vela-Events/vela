export interface SocialAuthUser {
  provider: 'google' | 'github';
  email: string;
  name?: string;
}
