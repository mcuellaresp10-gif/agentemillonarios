import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { searchPlayersByName } from '@/services/apiFootball'
import { BuscadorGlobal } from '@/components/shared/BuscadorGlobal'
import { TEAM_MILLONARIOS } from '@/config/constants'

export default function Buscar() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => searchPlayersByName(q),
    enabled: q.length >= 2,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-mill-blue">Búsqueda global</h1>
        <p className="text-slate-500">Jugadores y rivales Liga Colombiana</p>
      </div>
      <div className="max-w-xl">
        <BuscadorGlobal />
      </div>
      {q && (
        <>
          <p className="text-sm text-slate-500">
            Resultados para: <strong>{q}</strong>
          </p>
          {isLoading && <p>Cargando...</p>}
          <ul className="space-y-2">
            {(results ?? []).map((p) => (
              <li key={`${p.playerId}-${p.teamId}`}>
                <Link
                  to={
                    p.teamId === TEAM_MILLONARIOS
                      ? `/estadisticas/${p.playerId}`
                      : `/scouting/${p.playerId}?team=${p.teamId}`
                  }
                  className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:border-mill-blue"
                >
                  <img
                    src={p.photo || '/millonarios.svg'}
                    alt=""
                    className="h-10 w-10 rounded-full"
                    loading="lazy"
                  />
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      {p.teamName} · {p.position}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {!isLoading && !results?.length && (
            <p className="text-slate-500">Sin resultados.</p>
          )}
        </>
      )}
    </div>
  )
}
