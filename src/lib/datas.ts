const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function formatarData(date: string) {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return date
  const [, year, month, day] = match
  return `${day} ${meses[Number(month) - 1]} ${year}`
}
