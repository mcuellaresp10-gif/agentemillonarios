import { Link } from 'react-router-dom'
import { useOpponentsFromFixtures } from '@/hooks/useH2H'
import { Card, CardContent } from '@/components/ui/card'

export default function H2H() {
  const { data: opponents, isLoading } = useOpponentsFromFixtures()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-mill-blue">Head to Head</h1>
        <p className="text-slate-500">Histórico vs rivales</p>
      </div>
      {isLoading && <p className="text-slate-500">Cargando rivales...</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(opponents ?? []).map((o) => (
          <Link key={o.id} to={`/h2h/${o.id}`}>
            <Card className="hover:border-mill-blue transition-colors">
              <CardContent className="py-4 flex items-center gap-3">
                <img src={o.logo} alt="" className="h-10 w-10" loading="lazy" />
                <span className="font-medium">{o.name}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
