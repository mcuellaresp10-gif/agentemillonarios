import { useMemo, useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  scoutingPositionOptions,
  type ScoutingPosition,
} from '@/config/positionMetricProfiles'
import type { ScoutingMetricViewId } from '@/config/scoutingMetricViews'
import { getMetricViewsForPosition } from '@/config/scoutingMetricViews'
import { profilesForPosition } from '@/utils/scoutingMetrics'
import { buildScoutingProfiles } from '@/utils/scoutingMetrics'
import type { PlayerSeasonStats } from '@/types'
import { ScoutingMetricViewPicker } from '@/components/Scouting/ScoutingMetricViewPicker'
import { ScoutingScatter, ScoutingSelectedCard } from '@/components/Scouting/ScoutingScatter'
import {
  ScoutingRadar,
  peerAverageRadarFromPool,
  syntheticPeerProfile,
} from '@/components/Scouting/ScoutingRadar'
import { exportDomAsPng } from '@/utils/exportDomAsImage'
import {
  findMillonariosReference,
} from '@/utils/scoutReplacement'

export function ScoutingExplorer({
  players,
  millonariosPlayers,
  isLoading,
  seasonKey,
}: {
  players: PlayerSeasonStats[]
  millonariosPlayers: PlayerSeasonStats[]
  isLoading?: boolean
  seasonKey: string
}) {
  const [position, setPosition] = useState<ScoutingPosition>('M')
  const [metricView, setMetricView] = useState<ScoutingMetricViewId>('default')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  const profiles = useMemo(() => buildScoutingProfiles(players), [players])

  const positionProfiles = useMemo(
    () => profilesForPosition(profiles, position),
    [profiles, position],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return positionProfiles
    return positionProfiles.filter(
      (p) => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q),
    )
  }, [positionProfiles, search])

  const selectedProfile = useMemo(() => {
    const id = selectedId ?? filtered[0]?.playerId ?? null
    if (id == null) return null
    return filtered.find((p) => p.playerId === id) ?? positionProfiles.find((p) => p.playerId === id) ?? null
  }, [selectedId, filtered, positionProfiles])

  const millRef = useMemo(() => {
    if (!selectedProfile || !millonariosPlayers.length) return null
    const raw = players.find((p) => p.playerId === selectedProfile.playerId)
    if (!raw) return null
    return findMillonariosReference(millonariosPlayers, raw)
  }, [selectedProfile, millonariosPlayers, players])

  const millRefProfile = useMemo(() => {
    if (!millRef) return null
    return buildScoutingProfiles([...players, millRef]).find((p) => p.playerId === millRef.playerId) ?? null
  }, [millRef, players])

  const peerRadar = useMemo(() => {
    if (!selectedProfile) return null
    const values = peerAverageRadarFromPool(positionProfiles, position, selectedProfile.playerId)
    if (!values) return null
    return syntheticPeerProfile(values, position, selectedProfile)
  }, [selectedProfile, positionProfiles, position])

  const highlightIds = useMemo(() => {
    const ids: number[] = []
    if (millRefProfile) ids.push(millRefProfile.playerId)
    return ids
  }, [millRefProfile])

  useEffect(() => {
    const available = getMetricViewsForPosition(position)
    if (!available.some((v) => v.id === metricView)) setMetricView('default')
  }, [position, metricView])

  const positionLabel =
    scoutingPositionOptions().find((o) => o.value === position)?.label ?? position

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Posición</label>
          <Select
            value={position}
            onChange={(e) => setPosition(e.target.value as ScoutingPosition)}
            className="min-w-[140px]"
          >
            {scoutingPositionOptions().map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-slate-500 block mb-1">Buscar</label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre o equipo…"
          />
        </div>
        <button
          type="button"
          disabled={!chartRef.current}
          onClick={() => {
            if (chartRef.current) {
              void exportDomAsPng(chartRef.current, `scouting-${position}-${Date.now()}.png`)
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Exportar PNG
        </button>
      </div>

      <ScoutingMetricViewPicker position={position} value={metricView} onChange={setMetricView} />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div ref={chartRef}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Explorador — {positionLabel} ({filtered.length} jugadores)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-500">
                No hay jugadores con ≥90 min en esta posición. Amplía la búsqueda o cambia de
                liga.
              </p>
            ) : (
              <ScoutingScatter
                profiles={profiles}
                position={position}
                metricView={metricView}
                highlightIds={highlightIds}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}
          </CardContent>
        </Card>
        </div>

        <div className="space-y-4">
          <ScoutingSelectedCard
            profile={selectedProfile}
            millRefName={millRef ? millRef.name : undefined}
          />
          {selectedProfile && (
            <Link
              to={`/scouting/${selectedProfile.playerId}?season=${seasonKey}`}
              className="block text-sm text-mill-blue hover:underline"
            >
              Ver perfil completo →
            </Link>
          )}
        </div>
      </div>

      {selectedProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Radar vs pool y referencia Millonarios</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoutingRadar
              profile={selectedProfile}
              compareProfile={millRefProfile ?? peerRadar}
              labelA={selectedProfile.name}
              labelB={
                millRefProfile
                  ? `${millRefProfile.name} (Millonarios)`
                  : 'Promedio del pool'
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
