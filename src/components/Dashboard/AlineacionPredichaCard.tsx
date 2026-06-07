import { useCoachLineupHistory } from '@/hooks/useCoachLineupHistory'
import { CampoAlineacion } from './CampoAlineacion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { posicionEnEspanol } from '@/utils/positions'

function SkeletonCampo() {
  return (
    <div className="w-full max-h-72 aspect-[100/140] bg-slate-100 rounded-lg animate-pulse" />
  )
}

export function AlineacionPredichaCard() {
  const { coach, topFormation, formationCounts, predictedXI, bench, isLoading, loadedCount, totalCount } =
    useCoachLineupHistory(15)

  const topFormationCount = formationCounts[0]?.count ?? 0
  const coachShort = coach !== '—' ? coach.split(' ').slice(-1)[0] : 'DT'

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">
            Alineación probable · {coachShort}
          </CardTitle>
          {topFormation !== '—' && (
            <span className="inline-flex items-center rounded-full bg-mill-blue/10 px-2.5 py-0.5 text-xs font-medium text-mill-blue">
              {topFormation} · {topFormationCount}/{loadedCount} partidos
            </span>
          )}
        </div>
        {isLoading && (
          <p className="text-xs text-slate-400 mt-0.5">
            Cargando alineaciones… {loadedCount}/{totalCount}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isLoading && loadedCount < 3 ? (
          <SkeletonCampo />
        ) : loadedCount < 5 ? (
          <p className="text-sm text-slate-500 py-8 text-center">
            Historial insuficiente de alineaciones ({loadedCount} partidos con datos).
          </p>
        ) : (
          <>
            <CampoAlineacion formation={topFormation} players={predictedXI} />

            {bench.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-500 mb-1.5">Suplentes frecuentes</p>
                <div className="flex flex-wrap gap-2">
                  {bench.map((p) => (
                    <span
                      key={p.name}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600"
                    >
                      <span className="font-semibold text-mill-blue">
                        {p.number || posicionEnEspanol(p.pos)}
                      </span>
                      {p.name.split(' ').slice(-1)[0]}
                      <span className="text-slate-400 text-[10px]">{p.starts}×</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Basado en las últimas {loadedCount} alineaciones disponibles
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
