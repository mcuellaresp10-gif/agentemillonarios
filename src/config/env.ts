/** Lee variables Vite (browser) o process.env (Node/scripts). */
export function readEnv(key: string, fallback = ''): string {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const v = import.meta.env[key as keyof ImportMetaEnv]
      if (v != null && v !== '') return String(v)
    }
  } catch {
    /* Node sin import.meta.env */
  }
  const fromProcess = typeof process !== 'undefined' ? process.env[key] : undefined
  if (fromProcess != null && fromProcess !== '') return fromProcess
  return fallback
}

export function readEnvNumber(key: string, fallback: number): number {
  const raw = readEnv(key, '')
  if (!raw) return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}
