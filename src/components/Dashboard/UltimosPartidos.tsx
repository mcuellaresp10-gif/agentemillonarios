import { useRef } from 'react'
import type { Fixture } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PartidoCard } from '@/components/Calendario/PartidoCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function UltimosPartidos({ fixtures }: { fixtures: Fixture[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Últimos 5 partidos</CardTitle>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="p-1 rounded hover:bg-slate-100"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="p-1 rounded hover:bg-slate-100"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
        >
          {fixtures.length === 0 ? (
            <p className="text-slate-500">Sin partidos recientes.</p>
          ) : (
            fixtures.map((f) => (
              <div key={f.id} className="snap-start">
                <PartidoCard fixture={f} />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
