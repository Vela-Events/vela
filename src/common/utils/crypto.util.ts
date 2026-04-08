import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_PREFIX = 'vela_live';
const CLIENT_SECRET_PREFIX = 'vela_cs';

export interface GeneratedApiKey {
  plainTextKey: string;
  keyHash: string;
  keyPrefix: string;
}

export function createApiKey(): GeneratedApiKey {
  const secret = randomBytes(24).toString('hex');
  const plainTextKey = `${KEY_PREFIX}_${secret}`;
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(plainTextKey, salt, 64).toString('hex');

  return {
    plainTextKey,
    keyHash: `${salt}:${derivedKey}`,
    keyPrefix: `${KEY_PREFIX}_${secret.slice(0, 8)}`,
  };
}

export function createClientSecret(): GeneratedApiKey {
  const secret = randomBytes(24).toString('hex');
  const plainTextKey = `${CLIENT_SECRET_PREFIX}_${secret}`;
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(plainTextKey, salt, 64).toString('hex');

  return {
    plainTextKey,
    keyHash: `${salt}:${derivedKey}`,
    keyPrefix: `${CLIENT_SECRET_PREFIX}_${secret.slice(0, 8)}`,
  };
}

export function verifyClientSecret(
  plainTextKey: string,
  storedHash: string,
): boolean {
  return verifyApiKey(plainTextKey, storedHash);
}

export function verifyApiKey(
  plainTextKey: string,
  storedHash: string,
): boolean {
  const [salt, expectedHash] = storedHash.split(':');

  if (!salt || !expectedHash) {
    return false;
  }

  const derivedKey = scryptSync(plainTextKey, salt, 64);
  const expected = Buffer.from(expectedHash, 'hex');

  if (derivedKey.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expected);
}
