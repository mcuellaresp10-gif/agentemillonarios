import { useParams } from 'react-router-dom'
import { useH2H } from '@/hooks/useH2H'
import { useH2HPlayerStats } from '@/hooks/useH2HPlayers'
import { getTeamInfo } from '@/services/apiFootball'
import { useQuery } from '@tanstack/react-query'
import { H2HTable } from '@/components/H2H/H2HTable'
import { EstadisticasH2H } from '@/components/H2H/EstadisticasH2H'
import { RachaVsRival } from '@/components/H2H/RachaVsRival'
import { JugadoresH2H } from '@/components/H2H/JugadoresH2H'
import { H2H_FIXTURES_LAST } from '@/config/constants'

export default function H2HDetalle() {
  const { rivalId } = useParams()
  const id = Number(rivalId)
  const { data: fixtures, isLoading } = useH2H(id, H2H_FIXTURES_LAST)
  const { data: playerStats, isLoading: loadingPlayers } = useH2HPlayerStats(
    id,
    fixtures,
  )
  const { data: team } = useQuery({
    queryKey: ['team', id],
    queryFn: () => getTeamInfo(id),
    enabled: id > 0,
  })

  const rivalName = team?.name ?? 'Rival'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {team?.logo && <img src={team.logo} alt="" className="h-12 w-12" />}
        <div>
          <h1 className="text-3xl font-bold text-mill-blue">
            Millonarios vs {rivalName}
          </h1>
          <p className="text-slate-500">
            Últimos {H2H_FIXTURES_LAST} enfrentamientos · stats de jugadores
          </p>
        </div>
      </div>
      {isLoading ? (
        <p className="text-slate-500">Cargando H2H...</p>
      ) : (
        <>
          <EstadisticasH2H fixtures={fixtures ?? []} />
          <RachaVsRival fixtures={fixtures ?? []} />
          <JugadoresH2H
            stats={playerStats}
            rivalName={rivalName}
            isLoading={loadingPlayers}
          />
          {loadingPlayers && (
            <p className="text-xs text-slate-400">
              Cargando goleadores y alineaciones (puede tardar unos segundos la
              primera vez)…
            </p>
          )}
          <H2HTable
            fixtures={fixtures ?? []}
            byFixture={playerStats?.byFixture}
          />
        </>
      )}
    </div>
  )
}
