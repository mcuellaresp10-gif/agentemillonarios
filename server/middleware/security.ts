import crypto from 'crypto'
import type { Request, Response, NextFunction, Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

export const ACCESS_COOKIE = 'mf_access'

const LOCAL_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
]

export function isProduction(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.argv.includes('--prod')
  )
}

function accessToken(): string | null {
  const secret = (process.env.APP_ACCESS_SECRET ?? '').trim()
  if (!secret) return null
  return crypto.createHash('sha256').update(secret).digest('hex').slice(0, 48)
}

export function isAccessCodeRequired(): boolean {
  if (process.env.REQUIRE_ACCESS_CODE !== 'true') return false
  return accessToken() != null
}

function hasValidAccessCookie(req: Request): boolean {
  const expected = accessToken()
  if (!expected) return true
  const cookie = req.cookies?.[ACCESS_COOKIE]
  return typeof cookie === 'string' && cookie === expected
}

const PUBLIC_API_PREFIXES = ['/api/access', '/api/market/status']

export function configureTrustProxy(app: Express): void {
  app.set('trust proxy', 1)
}

export function configureHelmet(app: Express): void {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  )
}

export function configureCors(app: Express): void {
  const appUrl = (process.env.APP_URL ?? '').trim().replace(/\/$/, '')
  const allowed = new Set(LOCAL_ORIGINS)
  if (appUrl) allowed.add(appUrl)

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true)
        if (!isProduction()) {
          if (allowed.has(origin) || origin.startsWith('http://localhost:'))
            return callback(null, true)
        }
        if (allowed.has(origin)) return callback(null, true)
        callback(null, false)
      },
      credentials: true,
    }),
  )
}

export function requireAccessCookie(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isAccessCodeRequired()) {
    next()
    return
  }
  const path = req.path
  if (PUBLIC_API_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    next()
    return
  }
  if (path === '/api/access') {
    next()
    return
  }
  if (hasValidAccessCookie(req)) {
    next()
    return
  }
  res.status(403).json({
    error: 'Se requiere código de acceso',
    code: 'ACCESS_REQUIRED',
  })
}

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Intenta en unos minutos.' },
})

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Límite de análisis IA alcanzado (5/hora).' },
})

export const marketRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Límite de consultas de mercado alcanzado.' },
})

export const footballRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Límite de consultas de datos alcanzado.' },
})

export const scoutReadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Límite de consultas scout alcanzado.' },
})

export const scoutWriteRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Límite de actualizaciones scout alcanzado (30/hora).' },
})

export function accessStatusHandler(_req: Request, res: Response): void {
  res.json({
    required: isAccessCodeRequired(),
    granted: hasValidAccessCookie(_req),
  })
}

export function accessGrantHandler(req: Request, res: Response): void {
  const secret = (process.env.APP_ACCESS_SECRET ?? '').trim()
  const code = typeof req.query.code === 'string' ? req.query.code.trim() : ''

  if (!secret) {
    res.status(503).json({ error: 'Código de acceso no configurado en el servidor' })
    return
  }

  if (!code || code !== secret) {
    res.status(403).json({ error: 'Código incorrecto' })
    return
  }

  const token = accessToken()!
  const secure = isProduction()
  res.cookie(ACCESS_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })

  const accept = req.headers.accept ?? ''
  if (accept.includes('text/html')) {
    res.redirect('/')
    return
  }
  res.json({ ok: true })
}
