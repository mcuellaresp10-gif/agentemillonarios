import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { SplashScreen } from '@/components/shared/SplashScreen'
import { AccessGate } from '@/components/shared/AccessGate'
import { DashboardSkeleton } from '@/components/shared/Loading'
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

export default function App() {
  const [splash, setSplash] = useState(true)

  return (
    <QueryClientProvider client={queryClient}>
      {splash && <SplashScreen onDone={() => setSplash(false)} />}
      <AccessGate>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route
              index
              element={
                <Suspense fallback={<PageFallback />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="calendario"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Calendario />
                </Suspense>
              }
            />
            <Route
              path="calendario/:fixtureId"
              element={
                <Suspense fallback={<PageFallback />}>
                  <CalendarioDetalle />
                </Suspense>
              }
            />
            <Route
              path="analisis"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Analisis />
                </Suspense>
              }
            />
            <Route
              path="analisis/:fixtureId"
              element={
                <Suspense fallback={<PageFallback />}>
                  <AnalisisDetalle />
                </Suspense>
              }
            />
            <Route
              path="h2h"
              element={
                <Suspense fallback={<PageFallback />}>
                  <H2H />
                </Suspense>
              }
            />
            <Route
              path="h2h/:rivalId"
              element={
                <Suspense fallback={<PageFallback />}>
                  <H2HDetalle />
                </Suspense>
              }
            />
            <Route
              path="estadisticas"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Estadisticas />
                </Suspense>
              }
            />
            <Route
              path="estadisticas/:playerId"
              element={
                <Suspense fallback={<PageFallback />}>
                  <EstadisticasDetalle />
                </Suspense>
              }
            />
            <Route
              path="scouting"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Scouting />
                </Suspense>
              }
            />
            <Route
              path="scouting/:playerId"
              element={
                <Suspense fallback={<PageFallback />}>
                  <ScoutingDetalle />
                </Suspense>
              }
            />
            <Route
              path="tabla"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Tabla />
                </Suspense>
              }
            />
            <Route
              path="buscar"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Buscar />
                </Suspense>
              }
            />
            <Route
              path="simulacion"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Simulacion />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
      </AccessGate>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}
