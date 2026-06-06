import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  type DotProps,
} from 'recharts'

interface DataPoint {
  date: string
  rating: number
  opponent: string
  minutes: number
  result?: 'W' | 'D' | 'L'
}

const RESULT_COLOR: Record<string, string> = {
  W: '#10b981', // verde
  D: '#f59e0b', // amarillo
  L: '#ef4444', // rojo
}

const RESULT_LABEL: Record<string, string> = {
  W: 'Victoria',
  D: 'Empate',
  L: 'Derrota',
}

function CustomDot(props: DotProps & { payload?: DataPoint }) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null) return null
  const color = payload?.result ? RESULT_COLOR[payload.result] : '#94a3b8'
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={color}
      stroke="#fff"
      strokeWidth={1.5}
    />
  )
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: DataPoint }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const resultLabel = d.result ? RESULT_LABEL[d.result] : null
  const resultColor = d.result ? RESULT_COLOR[d.result] : '#64748b'

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md text-xs space-y-0.5">
      <p className="font-semibold text-slate-700">{d.opponent}</p>
      <p className="text-slate-500">{d.date}</p>
      {resultLabel && (
        <p style={{ color: resultColor }} className="font-medium">
          {resultLabel}
        </p>
      )}
      <p className="text-mill-blue font-stats font-semibold">
        Rating: {d.rating.toFixed(1)}
      </p>
      <p className="text-slate-500">{d.minutes} min</p>
    </div>
  )
}

export function GraficaRendimiento({
  data,
  avgRating,
}: {
  data: DataPoint[]
  avgRating?: number
}) {
  if (!data.length) {
    return <p className="text-slate-500 text-sm">Sin datos de rating por partido.</p>
  }

  const ratings = data.map((d) => d.rating)
  const minR = Math.min(...ratings)
  const maxR = Math.max(...ratings)
  const domainMin = Math.max(4, Math.floor(minR) - 0.5)
  const domainMax = Math.min(10, Math.ceil(maxR) + 0.5)

  return (
    <div>
      {/* Leyenda */}
      <div className="flex gap-3 mb-3 text-xs text-slate-500">
        {Object.entries(RESULT_LABEL).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: RESULT_COLOR[key] }}
            />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300" />
          Sin dato
        </span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[domainMin, domainMax]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              tickCount={5}
            />
            <Tooltip content={<CustomTooltip />} />
            {avgRating != null && (
              <ReferenceLine
                y={avgRating}
                stroke="#1E3A8A"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Prom. ${avgRating.toFixed(1)}`,
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: '#1E3A8A',
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="rating"
              stroke="#1E3A8A"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
