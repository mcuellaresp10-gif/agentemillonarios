import type { AnalisisGuardado } from '@/types'

const STORAGE_KEY = 'mf_analisis'

export function getAllAnalisis(): AnalisisGuardado[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AnalisisGuardado[]) : []
  } catch {
    return []
  }
}

export function getAnalisisPorPartido(
  partidoId: number | string,
  tipo: AnalisisGuardado['tipo'],
): AnalisisGuardado | null {
  return (
    getAllAnalisis().find(
      (a) => String(a.partido_id) === String(partidoId) && a.tipo === tipo,
    ) ?? null
  )
}

export function saveAnalisis(analisis: AnalisisGuardado): void {
  const all = getAllAnalisis().filter(
    (a) =>
      !(
        String(a.partido_id) === String(analisis.partido_id) &&
        a.tipo === analisis.tipo
      ),
  )
  all.push(analisis)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function hasAnalisis(partidoId: number | string, tipo?: AnalisisGuardado['tipo']): boolean {
  const all = getAllAnalisis()
  return all.some(
    (a) =>
      String(a.partido_id) === String(partidoId) &&
      (tipo ? a.tipo === tipo : true),
  )
}

export async function generateAnalysis(opts: {
  tipo: AnalisisGuardado['tipo']
  partidoId: number | string
  contexto: Record<string, unknown>
}): Promise<AnalisisGuardado> {
  const cached = getAnalisisPorPartido(opts.partidoId, opts.tipo)
  if (cached) return cached

  const res = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo: opts.tipo, contexto: opts.contexto }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    let message = (err as { error?: string }).error ?? 'Error al generar análisis'
    if (typeof message === 'string' && message.startsWith('{')) {
      try {
        const parsed = JSON.parse(message) as { error?: { message?: string } }
        message = parsed.error?.message ?? message
      } catch {
        /* keep raw */
      }
    }
    throw new Error(message)
  }

  const data = (await res.json()) as {
    contenido: string
    modelo_usado: string
    fecha_generacion: string
    fuentes: string[]
  }

  const analisis: AnalisisGuardado = {
    partido_id: opts.partidoId,
    tipo: opts.tipo,
    contenido: data.contenido,
    modelo_usado: data.modelo_usado,
    fecha_generacion: data.fecha_generacion,
    fuentes: data.fuentes,
  }
  saveAnalisis(analisis)
  return analisis
}

export function clearAnalisis(partidoId: number | string, tipo: AnalisisGuardado['tipo']) {
  const all = getAllAnalisis().filter(
    (a) => !(String(a.partido_id) === String(partidoId) && a.tipo === tipo),
  )
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}
