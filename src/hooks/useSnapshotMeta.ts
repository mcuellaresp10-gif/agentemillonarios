import { useQuery } from '@tanstack/react-query'
import { getManifestGeneratedAt } from '@/services/snapshotStore'

const WEEK = 7 * 24 * 60 * 60 * 1000

export function useSnapshotGeneratedAt() {
  return useQuery({
    queryKey: ['snapshotGeneratedAt'],
    queryFn: getManifestGeneratedAt,
    staleTime: WEEK,
  })
}
