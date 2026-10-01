import { getCategory } from './categorias'

export interface NewsItem {
  slug: string
  title: string
  date: string
  category: string
  source: string
  link: string
  summary: string
  content: string
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
  return { slug: path.split('/').pop()?.replace('.md', '') ?? path, title: metadata.title ?? '', date: metadata.date ?? '', category: getCategory(categorySlug)?.label ?? 'Negócios', source: metadata.fonte ?? '', link: metadata.link ?? '#', summary: metadata.resumo ?? '', content }
}).sort((first, second) => second.date.localeCompare(first.date))

export function getNewsBySlug(slug: string | undefined) { return news.find((item) => item.slug === slug) }
