const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// Aceita AAAA-MM-DD, AAAA-MM (mostra "ago 2026") e AAAA, para momentos sem data exata confirmada.
export function formatarData(date: string) {
  const completa = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (completa) return `${completa[3]} ${meses[Number(completa[2]) - 1]} ${completa[1]}`
  const mes = date.match(/^(\d{4})-(\d{2})$/)
  if (mes) return `${meses[Number(mes[2]) - 1]} ${mes[1]}`
  return date
}
