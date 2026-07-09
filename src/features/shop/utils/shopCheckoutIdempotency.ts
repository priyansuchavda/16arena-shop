const STORAGE_PREFIX = "shop:checkout:idempotency:";

/** In-memory cache so retries within the same session skip storage reads. */
const memoryKeys = new Map<string, string>();

const IDEMPOTENCY_KEY_PATTERN = /^[a-zA-Z0-9._:-]{8,100}$/;

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

function isValidIdempotencyKey(key: string): boolean {
  return IDEMPOTENCY_KEY_PATTERN.test(key);
}

function readFromStorage(userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw || !isValidIdempotencyKey(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

function writeToStorage(userId: string, key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(userId), key);
  } catch {
    // Storage may be unavailable (private mode, quota); in-memory key still works.
  }
}

function removeFromStorage(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}

export function resolveCheckoutUserId(
  user: { id?: string; uid?: string; userId?: string } | null | undefined
): string | null {
  if (!user) return null;
  return user.id ?? user.userId ?? user.uid ?? null;
}

/**
 * Returns the in-flight checkout idempotency key for this user, creating one if needed.
 * Call once when the user starts a checkout attempt (Pay / Place Order), not on preview loads.
 */
export function getOrCreateCheckoutIdempotencyKey(userId: string): string {
  const cached = memoryKeys.get(userId);
  if (cached && isValidIdempotencyKey(cached)) {
    return cached;
  }

  const stored = readFromStorage(userId);
  if (stored) {
    memoryKeys.set(userId, stored);
    return stored;
  }

  const key = generateIdempotencyKey();
  memoryKeys.set(userId, key);
  writeToStorage(userId, key);
  return key;
}

/** Clears the stored in-flight key after order creation, cancel, or a new purchase attempt. */
export function clearCheckoutIdempotencyKey(userId: string): void {
  memoryKeys.delete(userId);
  removeFromStorage(userId);
}

/** Network / timeout / 5xx failures should keep the same idempotency key for retries. */
export function isRetryableCheckoutError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  if (!err || typeof err !== "object") return false;

  const axiosErr = err as { code?: string; response?: { status?: number } };
  if (axiosErr.code === "ECONNABORTED" || axiosErr.code === "ERR_NETWORK") {
    return true;
  }

  const status = axiosErr.response?.status;
  if (status == null) return true;
  if (status === 408 || status === 429) return true;
  return status >= 500;
}
