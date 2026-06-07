import { useEffect, useState } from 'react'

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      onDone()
    }, 1500)
    return () => clearTimeout(t)
  }, [onDone])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-mill-blue text-white"
      role="status"
      aria-label="Cargando"
    >
      <img src="/Millonarios.png" alt="Millonarios FC" className="h-24 w-24 mb-6 animate-pulse" />
      <h1 className="text-2xl font-bold tracking-wide">MILLONARIOS ANALYTICS</h1>
      <p className="mt-2 text-sm text-blue-200">Análisis táctico & scouting</p>
    </div>
  )
}
