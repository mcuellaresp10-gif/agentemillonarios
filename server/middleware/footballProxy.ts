import type { Request, Response, NextFunction } from 'express'
import {
  createProxyMiddleware,
  responseInterceptor,
} from 'http-proxy-middleware'

/** Paths que usa el cliente en src/services/apiFootball.ts */
const ALLOWED_PATH_PREFIXES = [
  '/fixtures',
  '/players',
  '/standings',
  '/transfers',
  '/teams',
] as const

const CACHE_TTL_MS =
  Number(process.env.CACHE_DURATION_MS) || 4 * 60 * 60 * 1000

const DAILY_LIMIT = Number(process.env.API_FOOTBALL_DAILY_LIMIT) || 80

interface CacheEntry {
  status: number
  body: Buffer
  timestamp: number
}

const serverCache = new Map<string, CacheEntry>()

let quotaDay = ''
let quotaUsed = 0

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function resetQuotaIfNewDay(): void {
  const d = todayKey()
  if (quotaDay !== d) {
    quotaDay = d
    quotaUsed = 0
  }
}

export function isAllowedFootballPath(pathname: string): boolean {
  const path = pathname.split('?')[0]
  return ALLOWED_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

export function assertAllowedFootballPath(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isAllowedFootballPath(req.path)) {
    res.status(403).json({
      error: 'Ruta de API-Football no permitida',
      path: req.path,
    })
    return
  }
  next()
}

function cacheKey(req: Request): string {
  return req.originalUrl
}

export function footballCacheMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.method !== 'GET') {
    next()
    return
  }

  const key = cacheKey(req)
  const entry = serverCache.get(key)
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('X-Cache', 'HIT')
    res.status(entry.status).send(entry.body)
    return
  }
  next()
}

export function footballQuotaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.method !== 'GET') {
    next()
    return
  }

  const key = cacheKey(req)
  const entry = serverCache.get(key)
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    next()
    return
  }

  resetQuotaIfNewDay()
  if (quotaUsed >= DAILY_LIMIT) {
    res.status(429).json({
      error: `Cuota diaria de API-Football agotada (${DAILY_LIMIT}/día). Intenta mañana.`,
    })
    return
  }

  quotaUsed += 1
  res.setHeader('X-Football-Quota-Remaining', String(Math.max(0, DAILY_LIMIT - quotaUsed)))
  next()
}

export function createFootballProxy(apiHost: string, apiKey: string) {
  return createProxyMiddleware({
    target: `https://${apiHost}`,
    changeOrigin: true,
    pathRewrite: { '^/api/football': '' },
    selfHandleResponse: true,
    on: {
      proxyReq: (proxyReq) => {
        if (apiKey) proxyReq.setHeader('x-apisports-key', apiKey)
      },
      proxyRes: responseInterceptor(
        async (responseBuffer, proxyRes, req, _res) => {
          const expressReq = req as Request
          if (
            expressReq.method === 'GET' &&
            proxyRes.statusCode &&
            proxyRes.statusCode >= 200 &&
            proxyRes.statusCode < 300
          ) {
            serverCache.set(cacheKey(expressReq), {
              status: proxyRes.statusCode,
              body: responseBuffer,
              timestamp: Date.now(),
            })
          }
          return responseBuffer
        },
      ),
    },
  })
}
