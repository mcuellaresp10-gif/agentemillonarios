import { useState, useMemo, useCallback } from 'react'
import {
  BuscadorRefuerzos,
  type ScoutSearchMode,
} from '@/components/Scouting/BuscadorRefuerzos'
import { TablaScouting } from '@/components/Scouting/TablaScouting'
import {
  useScoutTeams,
  useColombianosExteriorTeams,
  useTeamPlayers,
  useScoutPool,
  useColombianosExteriorPool,
  type ScoutPoolEntry,
} from '@/hooks/useScouting'
import { useMillonariosPlayers } from '@/hooks/useJugadores'
import {
  filterScoutCandidates,
  sortPlayers,
  type ScoutFilters,
  type SortField,
} from '@/utils/filters'
import {
  replacementFitScore,
  millonariosFitScore,
  positionFilterFromPlayer,
  getAffinityReferenceLabel,
  findMillonariosReference,
} from '@/utils/scoutReplacement'
import {
  SCOUT_LEAGUES,
  COLOMBIANOS_EXTERIOR_LEAGUES,
  TEAM_MILLONARIOS,
  type ScoutLeagueConfig,
} from '@/config/constants'
import { defaultSeasonKey } from '@/config/scoutSnapshotSeasons'
import type { ScoutTeam } from '@/types'
import type { SeasonKey } from '@/types/scoutSnapshot'
import { useCandidatesEnrichment } from '@/hooks/useCandidatesEnrichment'
import { useSnapshotGeneratedAt } from '@/hooks/useSnapshotMeta'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Scouting() {
  const [seasonKey, setSeasonKey] = useState<SeasonKey>(defaultSeasonKey())
  const { data: scoutTeams, isLoading: loadingScoutTeams } = useScoutTeams(seasonKey)
  const { data: exteriorTeams, isLoading: loadingExteriorTeams } =
    useColombianosExteriorTeams(seasonKey)
  const { data: millPlayers } = useMillonariosPlayers(seasonKey)
  const { data: snapshotGeneratedAt } = useSnapshotGeneratedAt()
  const [mode, setMode] = useState<ScoutSearchMode>('equipo')
  const [filters, setFilters] = useState<ScoutFilters>({})
  const [replacePlayerId, setReplacePlayerId] = useState<number | undefined>()
  const [activeTeam, setActiveTeam] = useState<ScoutTeam | undefined>()
  const [poolActive, setPoolActive] = useState(false)
  const [searched, setSearched] = useState(false)
  const [sortField, setSortField] = useState<SortField>('ratingAvg')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const isColombianosMode = mode === 'colombianos-exterior'
  const activeLeagues: ScoutLeagueConfig[] = isColombianosMode
    ? COLOMBIANOS_EXTERIOR_LEAGUES
    : [...SCOUT_LEAGUES]

  const teamsSource = isColombianosMode ? exteriorTeams : scoutTeams
  const loadingTeams = isColombianosMode ? loadingExteriorTeams : loadingScoutTeams

  const teamsExMill = useMemo(
    () => (teamsSource ?? []).filter((t) => t.id !== TEAM_MILLONARIOS),
    [teamsSource],
  )

  const teamsForDropdown = useMemo(() => {
    if (!filters.leagueId) return teamsExMill
    return teamsExMill.filter((t) => t.leagueId === filters.leagueId)
  }, [teamsExMill, filters.leagueId])

  const poolEntries = useMemo((): ScoutPoolEntry[] => {
    const list = filters.leagueId
      ? teamsExMill.filter((t) => t.leagueId === filters.leagueId)
      : teamsExMill
    return list.map((t) => ({
      teamId: t.id,
      leagueId: t.leagueId,
      leagueLabel: t.leagueLabel,
    }))
  }, [teamsExMill, filters.leagueId])

  const { data: teamPlayers, isLoading: loadingTeam, refetch } = useTeamPlayers(
    activeTeam?.id ?? 0,
    activeTeam,
    seasonKey,
  )
  const { data: scoutPool, isLoading: loadingScoutPool, refetch: refetchScoutPool } =
    useScoutPool(poolEntries, poolActive && mode === 'reemplazo', seasonKey)
  const {
    data: colombianosPool,
    isLoading: loadingColombianosPool,
    refetch: refetchColombianosPool,
  } = useColombianosExteriorPool(
    poolEntries,
    poolActive && isColombianosMode,
    seasonKey,
  )

  const loadingPool = isColombianosMode ? loadingColombianosPool : loadingScoutPool

  const replaceTarget = useMemo(
    () => millPlayers?.find((p) => p.playerId === replacePlayerId),
    [millPlayers, replacePlayerId],
  )

  const rawPool = useMemo(() => {
    if (mode === 'reemplazo') return scoutPool ?? []
    if (isColombianosMode) return colombianosPool ?? []
    return teamPlayers ?? []
  }, [mode, isColombianosMode, scoutPool, colombianosPool, teamPlayers])

  const showResults = useMemo(() => {
    if (!searched || loadingTeams) return false
    if (mode === 'equipo') return activeTeam != null
    return poolActive && !loadingPool
  }, [searched, loadingTeams, mode, activeTeam, poolActive, loadingPool])

  const fitScores = useMemo(() => {
    if (!showResults || !millPlayers?.length || !rawPool.length) return undefined
    const map: Record<number, number> = {}
    for (const c of rawPool) {
      map[c.playerId] =
        mode === 'reemplazo' && replaceTarget
          ? replacementFitScore(c, replaceTarget)
          : millonariosFitScore(c, millPlayers, filters.position)
    }
    return map
  }, [rawPool, millPlayers, replaceTarget, mode, filters.position, showResults])

  const affinityHint = useMemo(() => {
    if (!millPlayers?.length) return ''
    if (mode === 'reemplazo' && replaceTarget) {
      return getAffinityReferenceLabel(replaceTarget, true)
    }
    const sample = rawPool[0]
    if (!sample) return 'Afinidad vs mejor referente Millonarios en la misma posición'
    const ref = findMillonariosReference(millPlayers, sample, filters.position)
    return getAffinityReferenceLabel(ref, false)
  }, [millPlayers, rawPool, replaceTarget, mode, filters.position])

  const sortedBase = useMemo(() => {
    const { minMarketValueEur, maxMarketValueEur, ...rest } = filters
    const list = filterScoutCandidates(rawPool, rest)
    return sortPlayers(list, sortField, sortDir, fitScores)
  }, [rawPool, filters, sortField, sortDir, fitScores])

  const { enrichment, loadingEnrichment } = useCandidatesEnrichment(
    sortedBase,
    showResults,
  )

  const displayPlayers = useMemo(
    () =>
      sortedBase.map((p) => ({
        ...p,
        ...(enrichment[p.playerId] ?? {}),
      })),
    [sortedBase, enrichment],
  )

  const filtered = useMemo(() => {
    return filterScoutCandidates(displayPlayers, filters)
  }, [displayPlayers, filters])

  const handleReplaceSelect = useCallback(
    (id: number | undefined) => {
      setReplacePlayerId(id)
      if (id && millPlayers) {
        const p = millPlayers.find((x) => x.playerId === id)
        if (p) {
          const pos = positionFilterFromPlayer(p)
          setFilters((f) => ({
            ...f,
            position: pos ?? f.position,
          }))
          setSortField('fitScore')
          setSortDir('desc')
        }
      }
    },
    [millPlayers],
  )

  const handleModeChange = (m: ScoutSearchMode) => {
    setMode(m)
    setSearched(false)
    setActiveTeam(undefined)
    setPoolActive(false)
    if (m === 'reemplazo') {
      if (replaceTarget) setSortField('fitScore')
    } else {
      setSortField('ratingAvg')
    }
  }

  const handleSeasonChange = (key: SeasonKey) => {
    setSeasonKey(key)
    setSearched(false)
    setActiveTeam(undefined)
    setPoolActive(false)
  }

  const snapshotDateLabel = snapshotGeneratedAt
    ? format(new Date(snapshotGeneratedAt), "d MMM yyyy", { locale: es })
    : null

  const handleSearch = () => {
    if (mode === 'reemplazo') {
      if (!replacePlayerId) return
      setSortField('fitScore')
      setSortDir('desc')
      setPoolActive(true)
      setSearched(true)
      refetchScoutPool()
      return
    }
    if (isColombianosMode) {
      setPoolActive(true)
      setSearched(true)
      refetchColombianosPool()
      return
    }
    if (filters.teamId) {
      const t = teamsExMill.find((x) => x.id === filters.teamId)
      if (t) setActiveTeam(t)
    } else if (teamsForDropdown[0]) {
      setActiveTeam(teamsForDropdown[0])
    }
    setSearched(true)
    refetch()
  }

  const handleClear = () => {
    setFilters({})
    setReplacePlayerId(undefined)
    setActiveTeam(undefined)
    setPoolActive(false)
    setSearched(false)
    setSortField('ratingAvg')
    setSortDir('desc')
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const isLoading =
    loadingTeams ||
    (mode === 'equipo' ? loadingTeam : loadingPool)

  const leagueScopeLabel = filters.leagueId
    ? activeLeagues.find((l) => l.id === filters.leagueId)?.label
    : isColombianosMode
      ? 'ligas internacionales'
      : 'todas las ligas configuradas'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-mill-blue">Scouting</h1>
        <p className="text-slate-500">
          Refuerzos regionales, reemplazos, colombianos en el exterior y búsqueda avanzada
          {snapshotDateLabel && (
            <span className="text-slate-400">
              {' '}
              · Datos de scouting del {snapshotDateLabel}
            </span>
          )}
        </p>
      </div>
      <BuscadorRefuerzos
        mode={mode}
        onModeChange={handleModeChange}
        filters={filters}
        onChange={setFilters}
        teams={teamsForDropdown}
        leagues={activeLeagues}
        millonariosPlayers={millPlayers ?? []}
        replacePlayerId={replacePlayerId}
        onReplacePlayerId={handleReplaceSelect}
        onSearch={handleSearch}
        onClear={handleClear}
        loadingPool={loadingPool}
        poolTeamCount={
          mode === 'reemplazo' || isColombianosMode ? poolEntries.length : undefined
        }
        seasonKey={seasonKey}
        onSeasonKeyChange={handleSeasonChange}
      />
      {mode === 'reemplazo' && !replacePlayerId && (
        <p className="text-sm text-slate-500">
          Elige un jugador de Millonarios en <strong>Reemplazo de…</strong> para ver candidatos
          en {leagueScopeLabel}.
        </p>
      )}
      {isColombianosMode && !searched && (
        <p className="text-sm text-slate-500">
          Pulsa <strong>Buscar colombianos</strong> para cargar jugadores con nacionalidad
          Colombia en {COLOMBIANOS_EXTERIOR_LEAGUES.length} ligas del exterior (Europa, MLS,
          México, CONMEBOL, etc.).
        </p>
      )}
      {mode === 'equipo' && !searched && (
        <p className="text-sm text-slate-500">
          Filtra por liga o equipo y pulsa <strong>Buscar</strong>.
        </p>
      )}
      {isLoading && (
        <p className="text-slate-500">
          {isColombianosMode
            ? `Buscando colombianos en el exterior (${poolEntries.length} equipos, ${leagueScopeLabel})…`
            : mode === 'reemplazo'
              ? `Cargando jugadores (${poolEntries.length} equipos en ${leagueScopeLabel})…`
              : 'Cargando jugadores…'}
        </p>
      )}
      {showResults && (
        <>
          <p className="text-sm text-slate-600">
            {filtered.length}{' '}
            {isColombianosMode
              ? `colombiano${filtered.length === 1 ? '' : 's'} en el exterior`
              : `candidato${filtered.length === 1 ? '' : 's'}`}
            {mode === 'reemplazo' && replaceTarget && (
              <span>
                {' '}
                para reemplazar a <strong>{replaceTarget.name}</strong>
              </span>
            )}
            {affinityHint && millPlayers?.length && (
              <span className="text-slate-500"> · {affinityHint}</span>
            )}
            {loadingEnrichment && (
              <span className="text-slate-400"> · cargando valores (top 30)…</span>
            )}
          </p>
          <TablaScouting
            players={filtered}
            sortField={sortField}
            sortDir={sortDir}
            onSort={toggleSort}
            fitScores={fitScores}
            showFitScore={showResults && !!millPlayers?.length}
            showNationality
            showLeague={isColombianosMode || !filters.leagueId || mode === 'reemplazo'}
            showValueColumns={showResults}
            enrichment={enrichment}
          />
        </>
      )}
      {searched && !isLoading && filtered.length === 0 && (
        <p className="text-slate-500">
          {isColombianosMode
            ? 'No se encontraron colombianos en el exterior con estos filtros.'
            : 'No hay jugadores con estos filtros.'}
        </p>
      )}
    </div>
  )
}
