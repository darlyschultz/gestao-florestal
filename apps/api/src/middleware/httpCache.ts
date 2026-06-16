import { Request, Response, NextFunction } from 'express'
import { cacheGet, cacheSet, cacheClearPrefix } from '../lib/cache'

/** Cacheia respostas JSON de GET (TTL em segundos). */
export function httpCacheMiddleware(ttlSeconds: number, keyPrefix = '') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next()

    const key = `${keyPrefix}${req.originalUrl}`
    const cached = cacheGet<unknown>(key)
    if (cached !== undefined) {
      res.set('X-Cache', 'HIT')
      res.set('Cache-Control', `private, max-age=${ttlSeconds}`)
      return res.json(cached)
    }

    const originalJson = res.json.bind(res)
    res.json = (body: unknown) => {
      cacheSet(key, body, ttlSeconds * 1000)
      res.set('X-Cache', 'MISS')
      res.set('Cache-Control', `private, max-age=${ttlSeconds}`)
      return originalJson(body)
    }

    next()
  }
}

export function invalidateCachePrefix(prefix: string) {
  cacheClearPrefix(prefix)
}
