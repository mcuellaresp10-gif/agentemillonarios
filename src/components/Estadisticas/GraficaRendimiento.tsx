import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

export function GraficaRendimiento({
  data,
}: {
  data: Array<{ date: string; rating: number }>
}) {
  if (!data.length) {
    return <p className="text-slate-500 text-sm">Sin datos de rating por partido.</p>
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[5, 10]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="#1E3A8A"
            strokeWidth={2}
            dot={{ fill: '#FCD116' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
