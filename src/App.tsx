import React, { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { SplashScreen } from '@/components/shared/SplashScreen'
import { AccessGate } from '@/components/shared/AccessGate'
import { DashboardSkeleton } from '@/components/shared/Loading'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { CACHE_DURATION_MS } from '@/config/constants'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Calendario = lazy(() => import('@/pages/Calendario'))
const CalendarioDetalle = lazy(() => import('@/pages/CalendarioDetalle'))
const Analisis = lazy(() => import('@/pages/Analisis'))
const AnalisisDetalle = lazy(() => import('@/pages/AnalisisDetalle'))
const H2H = lazy(() => import('@/pages/H2H'))
const H2HDetalle = lazy(() => import('@/pages/H2HDetalle'))
const Estadisticas = lazy(() => import('@/pages/Estadisticas'))
const EstadisticasDetalle = lazy(() => import('@/pages/EstadisticasDetalle'))
const Scouting = lazy(() => import('@/pages/Scouting'))
const ScoutingDetalle = lazy(() => import('@/pages/ScoutingDetalle'))
const Tabla = lazy(() => import('@/pages/Tabla'))
const Buscar = lazy(() => import('@/pages/Buscar'))
const Simulacion = lazy(() => import('@/pages/Simulacion'))
const Agente = lazy(() => import('@/pages/Agente'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_DURATION_MS,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function PageFallback() {
  return <DashboardSkeleton />
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  const [splash, setSplash] = useState(true)

  return (
    <QueryClientProvider client={queryClient}>
      {splash && <SplashScreen onDone={() => setSplash(false)} />}
      <AccessGate>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<PageWrapper><Dashboard /></PageWrapper>} />
            <Route path="calendario" element={<PageWrapper><Calendario /></PageWrapper>} />
            <Route path="calendario/:fixtureId" element={<PageWrapper><CalendarioDetalle /></PageWrapper>} />
            <Route path="analisis" element={<PageWrapper><Analisis /></PageWrapper>} />
            <Route path="analisis/:fixtureId" element={<PageWrapper><AnalisisDetalle /></PageWrapper>} />
            <Route path="h2h" element={<PageWrapper><H2H /></PageWrapper>} />
            <Route path="h2h/:rivalId" element={<PageWrapper><H2HDetalle /></PageWrapper>} />
            <Route path="estadisticas" element={<PageWrapper><Estadisticas /></PageWrapper>} />
            <Route path="estadisticas/:playerId" element={<PageWrapper><EstadisticasDetalle /></PageWrapper>} />
            <Route path="scouting" element={<PageWrapper><Scouting /></PageWrapper>} />
            <Route path="scouting/:playerId" element={<PageWrapper><ScoutingDetalle /></PageWrapper>} />
            <Route path="tabla" element={<PageWrapper><Tabla /></PageWrapper>} />
            <Route path="buscar" element={<PageWrapper><Buscar /></PageWrapper>} />
            <Route path="simulacion" element={<PageWrapper><Simulacion /></PageWrapper>} />
            <Route path="agente" element={<PageWrapper><Agente /></PageWrapper>} />
          </Route>
        </Routes>
      </BrowserRouter>
      </AccessGate>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}
