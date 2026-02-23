const LOGIN_EMAIL_CACHE_KEY = "doubts.auth.login-email.v1";
const LOGIN_SESSION_HINT_CACHE_KEY = "doubts.auth.session-hint.v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function safeGetItem(key: string) {
  if (!isBrowser()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures (private mode / quota).
  }
}

function safeRemoveItem(key: string) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures (private mode / quota).
  }
}

export function readCachedLoginEmail() {
  const email = safeGetItem(LOGIN_EMAIL_CACHE_KEY)?.trim() ?? "";
  return email || null;
}

export function writeCachedLoginEmail(email: string) {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail) {
    safeRemoveItem(LOGIN_EMAIL_CACHE_KEY);
    return;
  }

  safeSetItem(LOGIN_EMAIL_CACHE_KEY, trimmedEmail);
}

export function clearCachedLoginEmail() {
  safeRemoveItem(LOGIN_EMAIL_CACHE_KEY);
}

export function setCachedLoginSessionHint(hasSession: boolean) {
  if (hasSession) {
    safeSetItem(LOGIN_SESSION_HINT_CACHE_KEY, "1");
    return;
  }

  safeRemoveItem(LOGIN_SESSION_HINT_CACHE_KEY);
}

export function hasCachedLoginSessionHint() {
  return safeGetItem(LOGIN_SESSION_HINT_CACHE_KEY) === "1";
}

export function clearCachedLoginSessionHint() {
  safeRemoveItem(LOGIN_SESSION_HINT_CACHE_KEY);
}
