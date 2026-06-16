/** Cache em memória com TTL — reutilizado entre invocações quentes na Vercel. */
const store = new Map<string, { value: unknown; expiresAt: number }>()

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return undefined
  }
  return entry.value as T
}

export function cacheSet(key: string, value: unknown, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export async function cacheGetOrSet<T>(
  key: string,
  ttlMs: number,
  factory: () => Promise<T>,
): Promise<T> {
  const cached = cacheGet<T>(key)
  if (cached !== undefined) return cached
  const value = await factory()
  cacheSet(key, value, ttlMs)
  return value
}
