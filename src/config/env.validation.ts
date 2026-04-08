const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'CREDENTIALS_ENCRYPTION_KEY',
];

export function validateEnv(config: Record<string, unknown>) {
  const skip = config.SKIP_DATABASE === 'true';

  const required = skip
    ? requiredEnvVars.filter((k) => k !== 'DATABASE_URL')
    : requiredEnvVars;

  const missing = required.filter((key) => {
    const value = config[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  return config;
}
