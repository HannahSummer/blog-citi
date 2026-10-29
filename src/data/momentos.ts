export type MomentoTipo = 'premiacao' | 'evento' | 'projeto' | 'equipe'

export interface MomentoGaleriaItem { src: string; alt: string; legenda: string }
export interface Momento {
  slug: string
  title: string
  date: string
  tipo: MomentoTipo
  resumo: string
  capa: string
  capaAlt: string
  destaque: boolean
  galeria: MomentoGaleriaItem[]
  local?: string
  fonte?: string
  linkExterno?: string
  content: string
  draft: boolean
}

const markdownFiles = import.meta.glob<string>('../content/momentos/*.md', { eager: true, query: '?raw', import: 'default' })
const tipos: MomentoTipo[] = ['premiacao', 'evento', 'projeto', 'equipe']

function parse(raw: string) {
  const match = raw.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/)
  const metadata = Object.fromEntries((match?.[1] ?? '').split('\n').flatMap((line) => {
    const separator = line.indexOf(':')
    if (separator < 0) return []
    return [[line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')]]
  })) as Record<string, string>
  return { metadata, content: (match?.[2] ?? raw).trim() }
}

function parseGaleria(value: string | undefined, slug: string): MomentoGaleriaItem[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value.replace(/\\"/g, '"')) as MomentoGaleriaItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    console.warn(`[momentos] Galeria inválida: ${slug}`)
    return []
  }
}

const allMomentos: Momento[] = Object.entries(markdownFiles).map(([path, raw]) => {
  const { metadata, content } = parse(raw)
  const slug = path.split('/').pop()?.replace('.md', '') ?? path
  const tipo = metadata.tipo as MomentoTipo
  const required = ['title', 'date', 'tipo', 'resumo', 'capa', 'capa_alt']
  const missing = required.filter((field) => !metadata[field])
  // Ano (AAAA) ou mês (AAAA-MM) servem quando a data exata do evento não foi confirmada.
  const validDate = /^\d{4}(-\d{2}(-\d{2})?)?$/.test(metadata.date ?? '')
  const validTipo = tipos.includes(tipo)
  const draft = metadata.draft === 'true' || missing.length > 0 || !validDate || !validTipo
  if (missing.length > 0) console.warn(`[momentos] Front matter incompleto em ${slug}: ${missing.join(', ')}`)
  if (!validDate) console.warn(`[momentos] Data inválida em ${slug}; momento em rascunho`)
  if (!validTipo) console.warn(`[momentos] Tipo inválido em ${slug}; momento em rascunho`)
  return { slug, title: metadata.title ?? '', date: metadata.date ?? '', tipo, resumo: metadata.resumo ?? '', capa: metadata.capa ?? '', capaAlt: metadata.capa_alt ?? '', destaque: metadata.destaque === 'true', galeria: parseGaleria(metadata.galeria, slug), local: metadata.local || undefined, fonte: metadata.fonte || undefined, linkExterno: metadata.link_externo || undefined, content, draft }
}).sort((first, second) => second.date.localeCompare(first.date))

export function getMomentos() { return allMomentos.filter((momento) => !momento.draft) }
export function getMomentoBySlug(slug: string | undefined) { return allMomentos.find((momento) => momento.slug === slug && !momento.draft) }
export function getDestaque() {
  const destaques = allMomentos.filter((momento) => momento.destaque)
  if (destaques.length > 1) console.warn('[momentos] Mais de um destaque; usando o mais recente')
  return destaques[0]
}
// Capas e galerias de todos os momentos, cada foto uma vez, intercaladas: as fotos de um mesmo
// momento ficam espaçadas ao longo da lista em vez de juntas (o ENEJ, por exemplo, tem várias).
export function getFotosIntercaladas() {
  const fontes = new Set<string>()
  const momentos = getMomentos()
  return momentos.flatMap((momento, m) => {
    const fotos = [momento.capa, ...momento.galeria.map((foto) => foto.src)].filter((src) => src && !fontes.has(src) && fontes.add(src))
    // Cada momento distribui suas fotos em intervalos iguais, com um deslocamento próprio. Fotos
    // vizinhas na galeria (em geral parecidas) vão para casas alternadas: 1ª metade nas pares, 2ª nas ímpares.
    const meio = Math.ceil(fotos.length / 2)
    return fotos.map((src, k) => {
      const casa = k < meio ? k * 2 : (k - meio) * 2 + 1
      return { src, slug: momento.slug, titulo: momento.title, posicao: (casa + (m + 0.5) / momentos.length) / fotos.length }
    })
  }).sort((a, b) => a.posicao - b.posicao).map(({ posicao: _, ...foto }) => foto)
}
export function getTipos() { return tipos.filter((tipo) => getMomentos().some((momento) => momento.tipo === tipo)) }
