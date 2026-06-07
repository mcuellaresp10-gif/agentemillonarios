import 'dotenv/config'
import fs from 'fs'
import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import { analyzeHandler } from './routes/analyze.js'
import { marketStatusHandler, playerMarketHandler } from './routes/playerMarket.js'
import { sofascoreMatchHandler, sofascorelinkHandler } from './routes/sofascore.js'
import {
  configureTrustProxy,
  configureHelmet,
  configureCors,
  requireAccessCookie,
  apiRateLimiter,
  aiRateLimiter,
  marketRateLimiter,
  footballRateLimiter,
  scoutReadRateLimiter,
  scoutWriteRateLimiter,
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
import {
  scoutTeamsHandler,
  scoutPlayersHandler,
  scoutPlayerHandler,
  scoutPoolHandler,
  scoutMillonariosHandler,
  scoutFetchPlayerHandler,
  scoutFetchTeamHandler,
} from './routes/scoutDb.js'

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
app.get('/api/sofascore/match', sofascoreMatchHandler)
app.post('/api/sofascore/link', sofascorelinkHandler)
app.get('/api/market/status', marketStatusHandler)
app.get('/api/market/player', marketRateLimiter, playerMarketHandler)

app.get('/api/scout/teams', scoutReadRateLimiter, scoutTeamsHandler)
app.get('/api/scout/players', scoutReadRateLimiter, scoutPlayersHandler)
app.get('/api/scout/player/:id', scoutReadRateLimiter, scoutPlayerHandler)
app.get('/api/scout/pool', scoutReadRateLimiter, scoutPoolHandler)
app.get('/api/scout/millonarios', scoutReadRateLimiter, scoutMillonariosHandler)
app.post('/api/scout/fetch-player', scoutWriteRateLimiter, scoutFetchPlayerHandler)
app.post('/api/scout/fetch-team', scoutWriteRateLimiter, scoutFetchTeamHandler)

const distPath = path.join(__dirname, '../dist')
const indexHtml = path.join(distPath, 'index.html')
const hasFrontend = fs.existsSync(indexHtml)
const serveStatic = process.env.API_ONLY !== 'true' && hasFrontend

if (serveStatic) {
  app.use(express.static(distPath, { index: 'index.html', fallthrough: true }))
  // Express 5: wildcard con nombre (regex antigua no cubre bien /)
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(indexHtml, (err) => (err ? next(err) : undefined))
  })
} else if (isProduction()) {
  app.get('/', (_req, res) => {
    res.status(503).json({
      error: 'Frontend no disponible',
      hint: hasFrontend
        ? 'Quita API_ONLY=true en las variables de entorno'
        : 'El build no generó dist/index.html. Revisa el Build Command en Render.',
    })
  })
}

app.listen(PORT, () => {
  const apify = (process.env.APIFY_TOKEN ?? '').trim()
  const mode = serveStatic ? 'full' : process.env.API_ONLY === 'true' ? 'api-only' : 'dev'
  console.log(`API server http://localhost:${PORT} (${mode})`)
  if (serveStatic) {
    console.log(`[static] Sirviendo ${distPath}`)
  } else if (isProduction()) {
    console.warn(
      `[static] Sin frontend: API_ONLY=${process.env.API_ONLY ?? 'false'}, dist=${hasFrontend}`,
    )
  }
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
