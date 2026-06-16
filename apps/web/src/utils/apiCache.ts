const PREFIX = 'gf-cache:'

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

export function getSessionCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (Date.now() > entry.expiresAt) {
      sessionStorage.removeItem(PREFIX + key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

export function setSessionCache<T>(key: string, data: T, ttlMs: number): void {
  try {
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs }
    sessionStorage.setItem(PREFIX + key, JSON.stringify(entry))
  } catch {
    // quota exceeded — ignore
  }
}

export const CACHE_TTL = {
  regras: 5 * 60_000,
  cadastros: 3 * 60_000,
} as const
