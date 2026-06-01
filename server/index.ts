import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import { analyzeHandler } from './routes/analyze.js'
import { marketStatusHandler, playerMarketHandler } from './routes/playerMarket.js'
import {
  configureTrustProxy,
  configureHelmet,
  configureCors,
  requireAccessCookie,
  apiRateLimiter,
  aiRateLimiter,
  marketRateLimiter,
  footballRateLimiter,
  accessStatusHandler,
  accessGrantHandler,
  isProduction,
  isAccessCodeRequired,
} from './middleware/security.js'
import {
  assertAllowedFootballPath,
  footballCacheMiddleware,
  footballQuotaMiddleware,
  createFootballProxy,
} from './middleware/footballProxy.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3001
const API_KEY = process.env.API_FOOTBALL_KEY || ''
const API_HOST = process.env.API_FOOTBALL_HOST || 'v3.football.api-sports.io'

const app = express()

configureTrustProxy(app)
configureHelmet(app)
configureCors(app)
app.use(cookieParser())
app.use(express.json({ limit: '2mb' }))

app.get('/api/access/status', accessStatusHandler)
app.get('/api/access', accessGrantHandler)

app.use('/api', requireAccessCookie)
app.use('/api', apiRateLimiter)

app.use(
  '/api/football',
  footballRateLimiter,
  assertAllowedFootballPath,
  footballCacheMiddleware,
  footballQuotaMiddleware,
  createFootballProxy(API_HOST, API_KEY),
)

app.post('/api/ai/analyze', aiRateLimiter, analyzeHandler)
app.get('/api/market/status', marketStatusHandler)
app.get('/api/market/player', marketRateLimiter, playerMarketHandler)

const serveStatic =
  isProduction() && process.env.API_ONLY !== 'true'

if (serveStatic) {
  const distPath = path.join(__dirname, '../dist')
  app.use(express.static(distPath))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  const apify = (process.env.APIFY_TOKEN ?? '').trim()
  const mode = serveStatic ? 'full' : process.env.API_ONLY === 'true' ? 'api-only' : 'dev'
  console.log(`API server http://localhost:${PORT} (${mode})`)
  console.log(
    apify
      ? '[market] Transfermarkt vía Apify: configurado'
      : '[market] APIFY_TOKEN no definido — valor TM desactivado',
  )
  if (isAccessCodeRequired()) {
    console.log('[security] Código de acceso: activo (REQUIRE_ACCESS_CODE=true)')
  } else {
    console.log('[security] Código de acceso: desactivado')
  }
})
