/** Convierte cadenas TM tipo "€2.50m" o "€850k" a euros */
export function parseMarketValueToEur(raw: string | null | undefined): number | null {
  if (!raw || typeof raw !== 'string') return null
  const s = raw.replace(/\s/g, '').toLowerCase()
  const numMatch = s.match(/[\d,.]+/)
  if (!numMatch) return null
  const num = parseFloat(numMatch[0].replace(',', '.'))
  if (!Number.isFinite(num)) return null
  if (s.includes('bn') || s.includes('mrd') || s.includes('b')) return Math.round(num * 1e9)
  if (s.includes('m')) return Math.round(num * 1e6)
  if (s.includes('k') || s.includes('mil') || s.includes('th')) return Math.round(num * 1e3)
  return Math.round(num)
}

export function formatEurShort(eur: number | null | undefined): string {
  if (eur == null || !Number.isFinite(eur)) return '—'
  if (eur >= 1_000_000) {
    const m = eur / 1_000_000
    return `€${m >= 10 ? Math.round(m) : m.toFixed(2).replace(/\.?0+$/, '')}M`
  }
  if (eur >= 1_000) {
    const k = eur / 1_000
    return `€${k >= 100 ? Math.round(k) : k.toFixed(0)}k`
  }
  return `€${eur}`
}
