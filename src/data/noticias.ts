import { getCategory } from './categorias'
import { getContinente } from './continentes'

export interface NewsItem {
  slug: string
  title: string
  date: string
  category: string
  categorySlug: string
  source: string
  link: string
  summary: string
  content: string
  // Opcionais: posicionam a notícia no globo da página de notícias.
  continente?: string
  local?: string
  coordenadas?: [number, number]
}

const markdownFiles = import.meta.glob<string>('../content/noticias/*.md', { eager: true, query: '?raw', import: 'default' })

function parse(raw: string) {
  const match = raw.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/)
  const metadata = Object.fromEntries((match?.[1] ?? '').split('\n').flatMap((line) => {
    const separator = line.indexOf(':')
    if (separator < 0) return []
    return [[line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')]]
  })) as Record<string, string>
  return { metadata, content: (match?.[2] ?? raw).trim() }
}

export const news: NewsItem[] = Object.entries(markdownFiles).map(([path, raw]) => {
  const { metadata, content } = parse(raw)
  const categorySlug = metadata.categoria ?? 'negocios'
  if (!getCategory(categorySlug)) console.warn(`[noticias] Categoria inválida, notícia ignorada: ${path}`)
  const coordenadas: [number, number] = [Number(metadata.lng), Number(metadata.lat)]
  return {
    slug: path.split('/').pop()?.replace('.md', '') ?? path, title: metadata.title ?? '', date: metadata.date ?? '', category: getCategory(categorySlug)?.label ?? '', source: metadata.fonte ?? '', link: metadata.link ?? '#', summary: metadata.resumo ?? '', content, categorySlug,
    continente: getContinente(metadata.continente)?.slug, local: metadata.local || undefined,
    coordenadas: metadata.lat && metadata.lng && coordenadas.every(Number.isFinite) ? coordenadas : undefined,
  }
}).filter((item) => item.category).sort((first, second) => second.date.localeCompare(first.date))

export function getNewsBySlug(slug: string | undefined) { return news.find((item) => item.slug === slug) }
