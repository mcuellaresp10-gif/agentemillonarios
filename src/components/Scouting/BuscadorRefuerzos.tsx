import { useState } from 'react'
import { POSICIONES_FILTRO } from '@/utils/positions'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PerfilReferenciaReemplazo } from '@/components/Scouting/PerfilReferenciaReemplazo'
import type { ScoutFilters } from '@/utils/filters'
import type { PlayerSeasonStats, ScoutTeam } from '@/types'
import { SCOUT_LEAGUES, type ScoutLeagueConfig } from '@/config/constants'
import { SEASON_KEYS, seasonKeyLabel } from '@/config/scoutSnapshotSeasons'
import type { SeasonKey } from '@/types/scoutSnapshot'

export type ScoutSearchMode = 'equipo' | 'reemplazo' | 'colombianos-exterior'

export function BuscadorRefuerzos({
  mode,
  onModeChange,
  filters,
  onChange,
  teams,
  millonariosPlayers,
  replacePlayerId,
  onReplacePlayerId,
  onSearch,
  onClear,
  loadingPool,
  leagues = [...SCOUT_LEAGUES],
  poolTeamCount,
  seasonKey,
  onSeasonKeyChange,
}: {
  mode: ScoutSearchMode
  onModeChange: (m: ScoutSearchMode) => void
  filters: ScoutFilters
  onChange: (f: ScoutFilters) => void
  teams: ScoutTeam[]
  leagues: ScoutLeagueConfig[]
  millonariosPlayers: PlayerSeasonStats[]
  replacePlayerId: number | undefined
  onReplacePlayerId: (id: number | undefined) => void
  onSearch: () => void
  onClear: () => void
  loadingPool?: boolean
  poolTeamCount?: number
  seasonKey: SeasonKey
  onSeasonKeyChange: (key: SeasonKey) => void
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const replaceTarget = millonariosPlayers.find((p) => p.playerId === replacePlayerId)

  const setNum = (key: keyof ScoutFilters, raw: string) => {
    onChange({
      ...filters,
      [key]: raw === '' ? undefined : Number(raw),
    })
  }

  return (
    <div className="rounded-lg border border-blue-100 bg-white p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-mill-blue">Buscar refuerzos</h3>
        <div className="flex flex-wrap rounded-lg border border-slate-200 overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => onModeChange('equipo')}
            className={`px-3 py-1.5 transition-colors ${
              mode === 'equipo'
                ? 'bg-mill-blue text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Por equipo
          </button>
          <button
            type="button"
            onClick={() => onModeChange('reemplazo')}
            className={`px-3 py-1.5 transition-colors ${
              mode === 'reemplazo'
                ? 'bg-mill-blue text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Reemplazo de…
          </button>
          <button
            type="button"
            onClick={() => onModeChange('colombianos-exterior')}
            className={`px-3 py-1.5 transition-colors ${
              mode === 'colombianos-exterior'
                ? 'bg-mill-blue text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Colombianos exterior
          </button>
        </div>
      </div>

      {mode === 'reemplazo' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              Jugador actual de Millonarios
            </label>
            <Select
              value={replacePlayerId ?? ''}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : undefined
                onReplacePlayerId(id)
              }}
              className="max-w-md"
            >
              <option value="">Seleccionar jugador de plantilla…</option>
              {[...millonariosPlayers]
                .sort((a, b) => a.name.localeCompare(b.name, 'es'))
                .map((p) => (
                  <option key={p.playerId} value={p.playerId}>
                    {p.name} — {p.position}
                    {p.number != null ? ` (#${p.number})` : ''}
                  </option>
                ))}
            </Select>
          </div>
          {replaceTarget && <PerfilReferenciaReemplazo player={replaceTarget} />}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Temporada</label>
          <Select
            value={seasonKey}
            onChange={(e) => onSeasonKeyChange(e.target.value as SeasonKey)}
          >
            {SEASON_KEYS.map((key) => (
              <option key={key} value={key}>
                {seasonKeyLabel(key)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Liga / competición</label>
          <Select
            value={filters.leagueId ?? ''}
            onChange={(e) => {
              const leagueId = e.target.value ? Number(e.target.value) : undefined
              onChange({
                ...filters,
                leagueId,
                teamId: undefined,
              })
            }}
          >
            <option value="">Todas las ligas</option>
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Nombre</label>
          <Input
            placeholder="Buscar por nombre…"
            value={filters.nameQuery ?? ''}
            onChange={(e) =>
              onChange({ ...filters, nameQuery: e.target.value || undefined })
            }
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Posición</label>
          <Select
            value={filters.position ?? ''}
            onChange={(e) =>
              onChange({ ...filters, position: e.target.value || undefined })
            }
          >
            <option value="">Todas las posiciones</option>
            {POSICIONES_FILTRO.filter((p) => p.value !== 'all').map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>
        {mode !== 'colombianos-exterior' && (
          <div>
            <label className="text-xs text-slate-500 block mb-1">Nacionalidad</label>
            <Input
              placeholder="Ej. Colombia, Brasil…"
              value={filters.nationality ?? ''}
              onChange={(e) =>
                onChange({ ...filters, nationality: e.target.value || undefined })
              }
            />
          </div>
        )}
        {mode === 'colombianos-exterior' && (
          <div className="flex items-end">
            <p className="text-xs text-slate-600 pb-2">
              Solo jugadores con nacionalidad <strong>Colombia</strong> fuera del país.
            </p>
          </div>
        )}
        <div>
          <label className="text-xs text-slate-500 block mb-1">Edad mínima</label>
          <Input
            type="number"
            min={16}
            max={40}
            value={filters.minAge ?? ''}
            onChange={(e) => setNum('minAge', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Edad máxima</label>
          <Input
            type="number"
            min={16}
            max={45}
            value={filters.maxAge ?? ''}
            onChange={(e) => setNum('maxAge', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Rating mínimo</label>
          <Select
            value={filters.minRating ?? ''}
            onChange={(e) => setNum('minRating', e.target.value)}
          >
            <option value="">Cualquiera</option>
            <option value="6.5">6.5 o más</option>
            <option value="7">7.0 o más</option>
            <option value="7.5">7.5 o más</option>
            <option value="8">8.0 o más</option>
          </Select>
        </div>
        {mode === 'equipo' && (
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-500 block mb-1">Equipo</label>
            <Select
              value={filters.teamId ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  teamId: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            >
              <option value="">Primer equipo de la liga seleccionada</option>
              {leagues.map((league) => {
                const inLeague = teams.filter((t) => t.leagueId === league.id)
                if (!inLeague.length) return null
                return (
                  <optgroup key={league.id} label={league.label}>
                    {inLeague.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </optgroup>
                )
              })}
            </Select>
          </div>
        )}
        <div>
          <label className="text-xs text-slate-500 block mb-1">Goles mínimos</label>
          <Select
            value={filters.minGoals ?? ''}
            onChange={(e) => setNum('minGoals', e.target.value)}
          >
            <option value="">Cualquiera</option>
            <option value="1">1+</option>
            <option value="3">3+</option>
            <option value="5">5+</option>
            <option value="10">10+</option>
          </Select>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Asistencias mínimas</label>
          <Select
            value={filters.minAssists ?? ''}
            onChange={(e) => setNum('minAssists', e.target.value)}
          >
            <option value="">Cualquiera</option>
            <option value="1">1+</option>
            <option value="3">3+</option>
            <option value="5">5+</option>
          </Select>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="text-sm text-mill-blue hover:underline"
      >
        {showAdvanced ? '▲ Ocultar estadísticas avanzadas' : '▼ Estadísticas avanzadas'}
      </button>

      {showAdvanced && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-1 border-t border-slate-100">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Minutos mínimos</label>
            <Input
              type="number"
              min={0}
              placeholder="Ej. 450"
              value={filters.minMinutes ?? ''}
              onChange={(e) => setNum('minMinutes', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Partidos mínimos</label>
            <Input
              type="number"
              min={0}
              value={filters.minAppearances ?? ''}
              onChange={(e) => setNum('minAppearances', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">xG/90 mínimo</label>
            <Input
              type="number"
              min={0}
              step={0.01}
              placeholder="Ej. 0.15"
              value={filters.minXG90 ?? ''}
              onChange={(e) => setNum('minXG90', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Pases clave mínimos</label>
            <Input
              type="number"
              min={0}
              value={filters.minKeyPasses ?? ''}
              onChange={(e) => setNum('minKeyPasses', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">% Duelos ganados mín.</label>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="Ej. 45"
              value={filters.minDuelsWonPct ?? ''}
              onChange={(e) => setNum('minDuelsWonPct', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">% Pases precisos mín.</label>
            <Input
              type="number"
              min={0}
              max={100}
              value={filters.minPassAccuracy ?? ''}
              onChange={(e) => setNum('minPassAccuracy', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Entradas mínimas</label>
            <Input
              type="number"
              min={0}
              value={filters.minTackles ?? ''}
              onChange={(e) => setNum('minTackles', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Tiros a puerta mínimos</label>
            <Input
              type="number"
              min={0}
              value={filters.minShotsOn ?? ''}
              onChange={(e) => setNum('minShotsOn', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Intercepciones mínimas</label>
            <Input
              type="number"
              min={0}
              value={filters.minInterceptions ?? ''}
              onChange={(e) => setNum('minInterceptions', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Valor mercado mín. (€)</label>
            <Input
              type="number"
              min={0}
              step={100000}
              placeholder="Ej. 500000"
              value={filters.minMarketValueEur ?? ''}
              onChange={(e) => setNum('minMarketValueEur', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Valor mercado máx. (€)</label>
            <Input
              type="number"
              min={0}
              step={100000}
              placeholder="Ej. 3000000"
              value={filters.maxMarketValueEur ?? ''}
              onChange={(e) => setNum('maxMarketValueEur', e.target.value)}
            />
          </div>
          <p className="text-[11px] text-slate-400 sm:col-span-2 lg:col-span-4">
            El filtro por valor aplica a los primeros 30 candidatos con dato TM cargado.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <Button
          onClick={onSearch}
          disabled={loadingPool || (mode === 'reemplazo' && !replacePlayerId)}
        >
          {loadingPool
            ? 'Cargando…'
            : mode === 'reemplazo'
              ? 'Buscar reemplazos'
              : mode === 'colombianos-exterior'
                ? 'Buscar colombianos'
                : 'Buscar'}
        </Button>
        <Button variant="secondary" onClick={onClear}>
          Limpiar
        </Button>
        {(mode === 'reemplazo' || mode === 'colombianos-exterior') && (
          <p className="text-xs text-slate-500 w-full sm:w-auto">
            {poolTeamCount != null && poolTeamCount > 0
              ? mode === 'colombianos-exterior'
                ? `Escanea ${poolTeamCount} equipos en ligas del exterior y filtra nacionalidad Colombia. Primera carga: varios minutos; caché 4 h.`
                : `Analiza hasta ${poolTeamCount} equipos (Colombia A/B, Ecuador, Perú, Argentina). Primera carga: puede tardar 1–2 min; caché 4 h.`
              : 'Selecciona una liga para acotar la búsqueda o deja «Todas las ligas».'}
          </p>
        )}
      </div>
    </div>
  )
}
