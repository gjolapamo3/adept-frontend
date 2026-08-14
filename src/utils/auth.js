export const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }

  return null;
};

export const isUsableAuthToken = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const normalized = token.trim();
  if (!normalized) {
    return false;
  }

  const lower = normalized.toLowerCase();

  if (lower.startsWith('mock_') || lower.startsWith('demo_') || lower.startsWith('test_')) {
    return false;
  }

  if (normalized.includes('mock_secure_enterprise_token')) {
    return false;
  }

  return normalized.length >= 20 && normalized.includes('.') !== false;
};

export const getStoredAuthToken = () => {
  const storage = getStorage();
  if (!storage) {
    return '';
  }

  const candidates = [
    storage.getItem('adept_auth_token'),
    storage.getItem('token'),
  ];

  for (const candidate of candidates) {
    if (isUsableAuthToken(candidate)) {
      return candidate.trim();
    }
  }

  return '';
};
