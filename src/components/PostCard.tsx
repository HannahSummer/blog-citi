import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Post } from '../data/posts'

export function PostCard({ post }: { post: Post }) {
  return <Link className={`post-card post-card--${post.accent}`} to={`/blog/artigos/${post.slug}`}>
    <div className="post-card-media"><span className="vertical-category">{post.category}</span><span className="post-index">{post.slug.slice(0, 2).toUpperCase()}</span></div>
    <div className="post-card-body"><div className="post-meta">{post.date} <i>•</i> {post.readTime}</div><span className="card-rule" /><h3>{post.title}</h3><p>{post.excerpt}</p><span className="text-link">Ler artigo <ArrowUpRight size={16} /></span></div>
  </Link>
}

export function FeaturedPost({ post }: { post: Post }) {
  return <Link className="featured-post" to={`/blog/artigos/${post.slug}`}><div className={`featured-media featured-media--${post.accent}`}><span>EM DESTAQUE</span><strong>{post.category}</strong></div><div className="featured-copy"><div className="post-meta">{post.date} <i>•</i> {post.readTime}</div><h3>{post.title}</h3><p>{post.excerpt}</p><span className="button-primary">Ler artigo <ArrowUpRight size={17} /></span></div></Link>
}
