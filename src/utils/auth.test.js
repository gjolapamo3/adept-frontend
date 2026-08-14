import { beforeEach, describe, expect, it } from 'vitest';
import { getStoredAuthToken, isUsableAuthToken } from './auth';

const createStorage = () => {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    },
  };
};

describe('auth token helpers', () => {
  beforeEach(() => {
    globalThis.localStorage = createStorage();
  });

  it('returns the first usable real token from either storage key', () => {
    globalThis.localStorage.setItem('token', 'mock_secure_enterprise_token_2026');
    globalThis.localStorage.setItem('adept_auth_token', 'eyJhbGciOiJIUzI1NiJ9.real-token');

    expect(getStoredAuthToken()).toBe('eyJhbGciOiJIUzI1NiJ9.real-token');
  });

  it('rejects demo and mock placeholders', () => {
    globalThis.localStorage.setItem('token', 'mock_secure_enterprise_token_2026');

    expect(isUsableAuthToken('mock_secure_enterprise_token_2026')).toBe(false);
    expect(getStoredAuthToken()).toBe('');
  });
});
