import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CompetitionKey } from '@/config/constants'

interface AppState {
  competitionFilter: CompetitionKey
  sidebarOpen: boolean
  lastSearch: string[]
  setCompetition: (key: CompetitionKey) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  addSearch: (q: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      competitionFilter: 'all',
      sidebarOpen: false,
      lastSearch: [],
      setCompetition: (key) => set({ competitionFilter: key }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      addSearch: (q) =>
        set((s) => ({
          lastSearch: [q, ...s.lastSearch.filter((x) => x !== q)].slice(0, 10),
        })),
    }),
    { name: 'mf_app_state' },
  ),
)
