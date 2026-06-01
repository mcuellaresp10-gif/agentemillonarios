import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'

type AccessState = {
  required: boolean
  granted: boolean
  loading: boolean
}

export function AccessGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AccessState>({
    required: false,
    granted: true,
    loading: true,
  })
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/access/status', { credentials: 'include' })
      const data = (await res.json()) as { required: boolean; granted: boolean }
      setState({
        required: data.required,
        granted: data.granted,
        loading: false,
      })
    } catch {
      setState({ required: false, granted: true, loading: false })
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(
        `/api/access?code=${encodeURIComponent(code.trim())}`,
        { credentials: 'include' },
      )
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        setError(body.error ?? 'Código incorrecto')
        return
      }
      await refresh()
    } catch {
      setError('No se pudo validar el código')
    } finally {
      setSubmitting(false)
    }
  }

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-sm">Verificando acceso…</p>
      </div>
    )
  }

  if (!state.required || state.granted) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-mill-blue/5 to-slate-50 p-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        <img src="/millonarios.svg" alt="" className="h-14 w-14 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-mill-blue text-center">
          Millonarios Analytics
        </h1>
        <p className="text-sm text-slate-500 text-center mt-2 mb-6">
          Introduce el código de acceso que te compartieron para usar la aplicación.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            autoComplete="off"
            placeholder="Código de acceso"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mill-blue/30"
          />
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={submitting || !code.trim()}>
            {submitting ? 'Validando…' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
