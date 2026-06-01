import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  generateAnalysis,
  getAnalisisPorPartido,
  clearAnalisis,
} from '@/services/analysisAI'
import type { AnalisisGuardado } from '@/types'

function renderMarkdown(text: string) {
  return text
    .split('\n')
    .map((line, i) => {
      if (line.startsWith('## '))
        return (
          <h2 key={i} className="text-lg font-semibold text-mill-blue mt-4 mb-2">
            {line.slice(3)}
          </h2>
        )
      if (line.startsWith('- '))
        return (
          <li key={i} className="ml-4 list-disc text-slate-600">
            {line.slice(2)}
          </li>
        )
      if (line.trim())
        return (
          <p key={i} className="text-slate-600 leading-relaxed mb-2">
            {line}
          </p>
        )
      return null
    })
}

export function GeneradorAnalisisIA({
  partidoId,
  tipo,
  contexto,
}: {
  partidoId: number | string
  tipo: AnalisisGuardado['tipo']
  contexto: Record<string, unknown>
}) {
  const [analisis, setAnalisis] = useState<AnalisisGuardado | null>(() =>
    getAnalisisPorPartido(partidoId, tipo),
  )
  const [loading, setLoading] = useState(false)

  const generate = async (force = false) => {
    if (force) clearAnalisis(partidoId, tipo)
    setLoading(true)
    try {
      const result = await generateAnalysis({ tipo, partidoId, contexto })
      setAnalisis(result)
      toast.success('Análisis generado')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al generar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Button onClick={() => generate(false)} disabled={loading}>
          {loading ? 'Generando...' : analisis ? 'Ver guardado' : 'Generar con IA'}
        </Button>
        {analisis && (
          <>
            <Badge variant="ai">IA · {analisis.modelo_usado}</Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (confirm('¿Regenerar análisis? Esto consume créditos API.'))
                  generate(true)
              }}
            >
              Regenerar
            </Button>
          </>
        )}
      </div>
      {analisis && (
        <article className="prose-analysis rounded-lg border bg-white p-6">
          <p className="text-xs text-slate-400 mb-4">
            Fuentes: {analisis.fuentes.join(', ')} ·{' '}
            {new Date(analisis.fecha_generacion).toLocaleString('es-CO')}
          </p>
          {renderMarkdown(analisis.contenido)}
        </article>
      )}
    </div>
  )
}
