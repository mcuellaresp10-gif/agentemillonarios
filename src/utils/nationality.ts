/** Nacionalidad colombiana según texto de API-Football */
export function isColombianNationality(nationality: string | null | undefined): boolean {
  if (!nationality?.trim()) return false
  const n = nationality.toLowerCase().trim()
  return (
    n === 'colombia' ||
    n.includes('colombia') ||
    n === 'co' ||
    n.startsWith('col ')
  )
}
