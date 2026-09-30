export type Accent = 'lime' | 'blue' | 'orange'
export type FunnelStage = 'awareness' | 'consideracao' | 'intencao'
export type CtaType = 'newsletter' | 'material-rico' | 'diagnostico'

export interface Post {
  slug: string
  title: string
  excerpt: string
  metaDescription: string
  date: string
  category: string
  categorySlug: string
  funnelStage: FunnelStage
  ctaType: CtaType
  ctaLink?: string
  cover?: string
  author: string
  featured: boolean
  accent: Accent
  content: string
  readTime: string
}

type RawFrontMatter = Record<string, string | boolean>
const markdownFiles = import.meta.glob<string>('../content/posts/*.md', { eager: true, query: '?raw', import: 'default' })

function parseFrontMatter(raw: string): { metadata: RawFrontMatter; content: string } {
  const match = raw.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/)
  if (!match) return { metadata: {}, content: raw }
  const metadata = Object.fromEntries(match[1].split('\n').flatMap((line) => {
    const separator = line.indexOf(':')
    if (separator < 0) return []
    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
    return [[key, value === 'true' ? true : value === 'false' ? false : value]]
  })) as RawFrontMatter
  return { metadata, content: match[2].trim() }
}

function readTime(content: string) { return `${Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200))} min de leitura` }
function formatDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`)).replace('.', '')
}

export const posts: Post[] = Object.entries(markdownFiles).map(([path, raw]) => {
  const { metadata, content } = parseFrontMatter(raw)
  const slug = path.split('/').pop()?.replace('.md', '') ?? path
  const categorySlug = String(metadata.categoria ?? 'negocios')
  if (!metadata.title || !metadata.excerpt || !metadata.author) console.warn(`[posts] Front matter incompleto: ${slug}`)
  return {
    slug, title: String(metadata.title ?? ''), excerpt: String(metadata.excerpt ?? ''), metaDescription: String(metadata.meta_description ?? metadata.excerpt ?? ''),
    date: String(metadata.date ?? ''), category: String(metadata.categoryLabel ?? metadata.categoria ?? 'Negócios'), categorySlug,
    funnelStage: String(metadata.etapa_funil ?? 'awareness') as FunnelStage, ctaType: String(metadata.cta_tipo ?? 'newsletter') as CtaType,
    ctaLink: metadata.cta_link ? String(metadata.cta_link) : undefined, cover: metadata.cover ? String(metadata.cover) : undefined,
    author: String(metadata.author ?? 'CITi'), featured: Boolean(metadata.featured), accent: String(metadata.accent ?? 'lime') as Accent,
    content, readTime: String(metadata.readTime ?? readTime(content)),
  }
}).sort((first, second) => second.date.localeCompare(first.date))

export function getPostBySlug(slug: string | undefined) { return posts.find((post) => post.slug === slug) }
export function getPostsByCategoria(category: string | undefined) { return category ? posts.filter((post) => post.categorySlug === category) : posts }
export function getRelatedPosts(slug: string, amount = 3) {
  const current = getPostBySlug(slug)
  return posts.filter((post) => post.slug !== slug && post.categorySlug === current?.categorySlug).concat(posts.filter((post) => post.slug !== slug && post.categorySlug !== current?.categorySlug)).slice(0, amount)
}