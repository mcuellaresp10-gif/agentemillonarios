/**
 * Escribe dist/_redirects tras el build de Vite.
 * En Netlify define NETLIFY_BACKEND_URL (URL del API en Render, sin barra final).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'dist')
const outFile = path.join(distDir, '_redirects')

const backend = (process.env.NETLIFY_BACKEND_URL ?? '').trim().replace(/\/$/, '')

let lines = ['# SPA', '/*    /index.html   200']

if (backend) {
  lines = [
    '# API → backend (Render)',
    `/api/*  ${backend}/api/:splat  200`,
    '',
    '# SPA',
    '/*    /index.html   200',
  ]
  console.log(`[netlify] Proxy /api/* → ${backend}/api/*`)
} else {
  console.warn(
    '[netlify] NETLIFY_BACKEND_URL no definida: el frontend no podrá llamar a /api hasta configurarla en Netlify.',
  )
}

fs.writeFileSync(outFile, `${lines.join('\n')}\n`, 'utf8')
