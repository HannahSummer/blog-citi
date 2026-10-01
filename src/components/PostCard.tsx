import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { getCategory } from '../data/categorias'
import type { Post } from '../data/posts'
import { formatarData } from '../lib/datas'

function CategoryPlaceholder({ category }: { category: string }) {
  return <svg className={`post-card-placeholder post-card-placeholder--${category}`} viewBox="0 0 640 360" aria-hidden="true">
    {category === 'negocios' && <><defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="currentColor" opacity=".7" /></pattern></defs><rect width="640" height="360" fill="url(#dots)" /><path d="M0 300C150 210 250 340 390 220S560 150 640 70" fill="none" stroke="currentColor" strokeWidth="2" opacity=".65" /></>}
    {category === 'solucoes' && <><path d="M-40 330 260 -20M70 390 370 40M180 430 480 80M290 450 590 100M400 470 700 120" fill="none" stroke="currentColor" strokeWidth="3" opacity=".7" /></>}
    {category === 'inovacao' && <><circle cx="320" cy="180" r="7" fill="currentColor" /><circle cx="180" cy="100" r="4" fill="currentColor" /><circle cx="490" cy="85" r="5" fill="currentColor" /><circle cx="520" cy="260" r="3" fill="currentColor" /><path d="M180 100 320 180 490 85M320 180 520 260" fill="none" stroke="currentColor" strokeWidth="1" opacity=".65" /></>}
    {category === 'institucional' && <><circle cx="320" cy="180" r="125" fill="none" stroke="currentColor" strokeWidth="2" opacity=".75" /><circle cx="320" cy="180" r="82" fill="none" stroke="currentColor" strokeWidth="2" opacity=".55" /><circle cx="320" cy="180" r="38" fill="none" stroke="currentColor" strokeWidth="2" opacity=".4" /></>}
    {category === 'gestao' && <><path d="M0 360 150 70 300 360ZM230 360 410 20 640 360Z" fill="currentColor" opacity=".2" /><path d="m150 70 80 290M410 20 300 360M410 20l230 340" fill="none" stroke="currentColor" strokeWidth="2" opacity=".7" /></>}
  </svg>
}

function PostCover({ post }: { post: Post }) {
  const category = getCategory(post.categorySlug)
  const [fallback, setFallback] = useState(!post.cover && !category?.capaPadrao)
  const source = post.cover ?? category?.capaPadrao
  if (fallback || !source) return <div className="post-card-cover"><CategoryPlaceholder category={post.categorySlug} /></div>
  return <div className="post-card-cover"><img src={source} alt={post.cover ? post.title : ''} onError={() => setFallback(true)} /></div>
}

export function PostCard({ post, position = 1 }: { post: Post; position?: number }) {
  return <Link className={`post-card post-card--${post.accent}`} to={`/blog/artigos/${post.slug}`}>
    <PostCover post={post} /><div className="post-card-body"><div className="post-card-meta"><span><b>{String(position).padStart(2, '0')}</b>{post.category}</span><ArrowRight className="post-card-arrow" size={18} /></div><h3>{post.title}</h3><p>{post.excerpt}</p><span className="post-card-footer">{formatarData(post.date).toUpperCase()} <i>·</i> {post.readTime.toUpperCase()}</span></div>
  </Link>
}

export function FeaturedPost({ post }: { post: Post }) {
  return <Link className="featured-post" to={`/blog/artigos/${post.slug}`}><div className={`featured-media featured-media--${post.accent}`}><span>EM DESTAQUE</span></div><div className="featured-copy"><div className="post-meta">{formatarData(post.date)} <i>•</i> {post.category} <i>•</i> {post.readTime}</div><h3>{post.title}</h3><p>{post.excerpt}</p><span className="button-primary">Ler artigo <ArrowUpRight size={17} /></span></div></Link>
}
