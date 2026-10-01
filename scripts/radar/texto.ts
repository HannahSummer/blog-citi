/** Remove acentos, HTML e espaços extras, e coloca em minúsculas. */
export function normalizar(texto: string): string {
  return ` ${limparHtml(texto)} `
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[“”"]/g, '')
    .replace(/\s+/g, ' ')
}

export function limparHtml(texto: string): string {
  return (texto || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#8217;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function slugify(texto: string): string {
  return normalizar(texto)
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/g, '')
}

/** Similaridade de Jaccard entre os conjuntos de palavras (>3 letras) de dois títulos. */
export function similaridade(a: string, b: string): number {
  const palavras = (t: string) => new Set(normalizar(t).split(' ').filter((p) => p.length > 3))
  const A = palavras(a)
  const B = palavras(b)
  if (!A.size || !B.size) return 0
  let comum = 0
  for (const p of A) if (B.has(p)) comum++
  return comum / (A.size + B.size - comum)
}

export function dataISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}
