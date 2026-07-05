import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { ScoutingPosition } from '@/config/positionMetricProfiles'
import { getPositionProfile } from '@/config/positionMetricProfiles'
import type { ScoutingProfile } from '@/utils/scoutingMetrics'
import { CHART_GOLD } from '@/components/Estadisticas/charts/chartTheme'

const RADAR_PLAYER = {
  stroke: CHART_GOLD,
  fill: CHART_GOLD,
  fillOpacity: 0.25,
  strokeWidth: 2,
}

const RADAR_COMPARE = {
  stroke: '#64748B',
  fill: '#64748B',
  fillOpacity: 0.12,
  strokeWidth: 1.5,
}

interface ScoutingRadarProps {
  profile: ScoutingProfile
  compareProfile?: ScoutingProfile | null
  labelA?: string
  labelB?: string
  height?: number
}

export function ScoutingRadar({
  profile,
  compareProfile,
  labelA,
  labelB = 'Promedio del pool',
  height = 340,
}: ScoutingRadarProps) {
  const positionProfile = getPositionProfile(profile.position)

  const chartData = positionProfile.radarAxes.map((axis) => ({
    stat: axis.label,
    A: profile.radarValues[axis.key] ?? 0,
    B: compareProfile
      ? (compareProfile.radarValues[axis.key] ?? profile.radarPeerAverage[axis.key] ?? 5)
      : (profile.radarPeerAverage[axis.key] ?? 5),
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsRadar data={chartData}>
        <PolarGrid stroke="#E2E8F0" />
        <PolarAngleAxis dataKey="stat" tick={{ fill: '#64748B', fontSize: 10 }} />
        <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 9, fill: '#64748B' }} />
        <Radar name={labelA ?? profile.name} dataKey="A" {...RADAR_PLAYER} />
        <Radar name={labelB} dataKey="B" {...RADAR_COMPARE} />
        <Legend wrapperStyle={{ fontSize: '12px', color: '#64748B' }} />
      </RechartsRadar>
    </ResponsiveContainer>
  )
}

export {
  peerAverageRadarFromPool,
  syntheticPeerProfile,
} from '@/utils/scoutingMetrics'

export type { ScoutingPosition }
