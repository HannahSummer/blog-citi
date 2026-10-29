import { getCategory } from './categorias'
import { getSubtema } from './subtemas'
import { parseFrontMatter } from '../lib/frontMatter'

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
  subtema?: string
  draft: boolean
  funnelStage: FunnelStage
  ctaType: CtaType
  ctaLink?: string
  cover?: string
  coverAlt: string
  author: string
  featured: boolean
  accent: Accent
  content: string
  readTime: string
}

const markdownFiles = import.meta.glob<string>('../content/posts/*.md', { eager: true, query: '?raw', import: 'default' })

function readTime(content: string) { return `${Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200))} min de leitura` }
export const posts: Post[] = Object.entries(markdownFiles).map(([path, raw]) => {
  const { metadata, content } = parseFrontMatter(raw)
  const slug = path.split('/').pop()?.replace('.md', '') ?? path
  const categorySlug = String(metadata.categoria ?? 'negocios')
  if (!metadata.title || !metadata.excerpt || !metadata.author) console.warn(`[posts] Front matter incompleto: ${slug}`)
  const subtema = metadata.subtema ? String(metadata.subtema) : undefined
  const validSubtema = subtema && getSubtema(subtema)?.parentSlug === categorySlug ? subtema : undefined
  if (subtema && !validSubtema) console.warn(`[posts] Subtema inválido para ${slug}: ${subtema}`)
  const draft = categorySlug === 'institucional' || metadata.draft === true
  if (draft && categorySlug === 'institucional') console.warn(`[posts] Categoria removida, post em rascunho: ${slug}`)
  return {
    slug, title: String(metadata.title ?? ''), excerpt: String(metadata.excerpt ?? ''), metaDescription: String(metadata.meta_description ?? metadata.excerpt ?? ''),
    date: String(metadata.date ?? ''), category: getCategory(categorySlug)?.label ?? 'Negócios', categorySlug, subtema: validSubtema, draft,
    funnelStage: String(metadata.etapa_funil ?? 'awareness') as FunnelStage, ctaType: String(metadata.cta_tipo ?? 'newsletter') as CtaType,
    ctaLink: metadata.cta_link ? String(metadata.cta_link) : undefined, cover: metadata.cover ? String(metadata.cover) : undefined, coverAlt: String(metadata.cover_alt ?? ''),
    author: String(metadata.author ?? 'CITi'), featured: Boolean(metadata.featured), accent: String(metadata.accent ?? 'lime') as Accent,
    content, readTime: String(metadata.readTime ?? readTime(content)),
  }
}).filter((post) => !post.draft).sort((first, second) => second.date.localeCompare(first.date))

export function getPostBySlug(slug: string | undefined) { return posts.find((post) => post.slug === slug) }
export function getPostsByCategoria(category: string | undefined) { return category ? posts.filter((post) => post.categorySlug === category) : posts }
export function getRelatedPosts(slug: string, amount = 3) {
  const current = getPostBySlug(slug)
  return posts.filter((post) => post.slug !== slug && post.categorySlug === current?.categorySlug).concat(posts.filter((post) => post.slug !== slug && post.categorySlug !== current?.categorySlug)).slice(0, amount)
}