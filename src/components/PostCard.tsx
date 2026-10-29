import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { getCategory } from '../data/categorias'
import { getSubtema } from '../data/subtemas'
import type { Post } from '../data/posts'
import { formatarData } from '../lib/datas'

function CategoryPlaceholder({ category }: { category: string }) {
  return <svg className={`post-card-placeholder post-card-placeholder--${category}`} viewBox="0 0 640 360" aria-hidden="true">
    {category === 'negocios' && <><defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="currentColor" opacity=".7" /></pattern></defs><rect width="640" height="360" fill="url(#dots)" /><path d="M0 300C150 210 250 340 390 220S560 150 640 70" fill="none" stroke="currentColor" strokeWidth="2" opacity=".65" /></>}
    {category === 'solucoes' && <><path d="M-40 330 260 -20M70 390 370 40M180 430 480 80M290 450 590 100M400 470 700 120" fill="none" stroke="currentColor" strokeWidth="3" opacity=".7" /></>}
    {category === 'inovacao' && <><circle cx="320" cy="180" r="7" fill="currentColor" /><circle cx="180" cy="100" r="4" fill="currentColor" /><circle cx="490" cy="85" r="5" fill="currentColor" /><circle cx="520" cy="260" r="3" fill="currentColor" /><path d="M180 100 320 180 490 85M320 180 520 260" fill="none" stroke="currentColor" strokeWidth="1" opacity=".65" /></>}
    {category === 'gestao' && <><path d="M0 360 150 70 300 360ZM230 360 410 20 640 360Z" fill="currentColor" opacity=".2" /><path d="m150 70 80 290M410 20 300 360M410 20l230 340" fill="none" stroke="currentColor" strokeWidth="2" opacity=".7" /></>}
  </svg>
}

// Capa do artigo (gerada por `npm run capas` ou feita à mão), com a da categoria e o desenho como reserva.
export function capaDoPost(post: Post) {
  return post.cover ?? getCategory(post.categorySlug)?.capaPadrao
}

function PostCover({ post, className = 'post-card-cover' }: { post: Post; className?: string }) {
  const source = capaDoPost(post)
  const [fallback, setFallback] = useState(!source)
  if (fallback || !source) return <div className={className}><CategoryPlaceholder category={post.categorySlug} /></div>
  return <div className={className}><img src={source} alt={post.cover ? post.coverAlt : ''} loading="lazy" onError={() => setFallback(true)} /></div>
}

// "Soluções · Dados" quando há subtema.
export function rotuloDoPost(post: Post) {
  const subtema = getSubtema(post.subtema)?.label
  return subtema ? `${post.category} · ${subtema}` : post.category
}

// `compacto`: capa discreta (faixa fina) e sem resumo, para fileiras horizontais como a da Home.
export function PostCard({ post, position = 1, compacto = false }: { post: Post; position?: number; compacto?: boolean }) {
  return <Link className={`post-card post-card--${post.accent}${compacto ? ' post-card--compacto' : ''}`} to={`/blog/artigos/${post.slug}`}>
    <PostCover post={post} /><div className="post-card-body"><div className="post-card-meta"><span><b>{String(position).padStart(2, '0')}</b>{rotuloDoPost(post)}</span><ArrowRight className="post-card-arrow" size={18} /></div><h3>{post.title}</h3>{!compacto && <p>{post.excerpt}</p>}<span className="post-card-footer">{formatarData(post.date).toUpperCase()} <i>·</i> {post.readTime.toUpperCase()}</span></div>
  </Link>
}

export function FeaturedPost({ post }: { post: Post }) {
  return <Link className="featured-post" to={`/blog/artigos/${post.slug}`}><div className={`featured-media featured-media--${post.accent}`}><PostCover post={post} className="featured-media-capa" /><span>EM DESTAQUE</span></div><div className="featured-copy"><div className="post-meta">{formatarData(post.date)} <i>•</i> {rotuloDoPost(post)} <i>•</i> {post.readTime}</div><h3>{post.title}</h3><p>{post.excerpt}</p><span className="button-primary">Ler artigo <ArrowUpRight size={17} /></span></div></Link>
}

// Destaque da página do Blog: capa grande ao lado do texto, no padrão do destaque de Notícias.
export function PostDestaque({ post }: { post: Post }) {
  return <Link className="artigo-destaque" to={`/blog/artigos/${post.slug}`}>
    <PostCover post={post} className="artigo-destaque-capa" />
    <div className="artigo-destaque-texto">
      <span className="news-card-flag">Em destaque</span>
      <span className="artigo-destaque-meta">{rotuloDoPost(post)} <i>·</i> {post.readTime}</span>
      <h2>{post.title}</h2>
      <p>{post.excerpt}</p>
      <span className="button-primary">Ler artigo <ArrowUpRight size={17} /></span>
    </div>
  </Link>
}
