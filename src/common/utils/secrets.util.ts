import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'CREDENTIALS_ENCRYPTION_KEY environment variable is required',
    );
  }
  return createHash('sha256').update(key).digest();
}

export function encodeSecret(value: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Format: base64(iv + authTag + ciphertext)
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
}

export function decodeSecret(value: string): string {
  const key = getKey();
  const combined = Buffer.from(value, 'base64');

  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted secret: data too short');
  }

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function isAllowedWebhookUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const allowedHosts = [
      'hooks.slack.com',
      'discord.com',
      'canary.discord.com',
      'ptb.discord.com',
    ];

    return url.protocol === 'https:' && allowedHosts.includes(url.hostname);
  } catch {
    return false;
  }
}
