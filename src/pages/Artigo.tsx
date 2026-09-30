import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { getPostBySlug, getRelatedPosts } from '../data/posts'
import { NewsletterBlock } from '../components/NewsletterBlock'
import { PostCard } from '../components/PostCard'
import { SEO } from '../components/SEO'

export function Artigo() {
  const { slug } = useParams<{ slug: string }>()
  const post = getPostBySlug(slug)
  if (!post) return <Navigate to="/blog/artigos" replace />
  return <><SEO title={post.title} description={post.metaDescription} type="article" /><div className="reading-progress" /><article className="article-page container"><Link className="back-link" to="/blog/artigos"><ArrowLeft size={16} /> Todos os artigos</Link><header className="article-header"><span className="eyebrow">{post.category}</span><h1>{post.title}</h1><p>{post.excerpt}</p><div className="article-meta">Por <strong>{post.author}</strong> <i>•</i> {post.date} <i>•</i> {post.readTime}</div></header><div className={`article-cover article-cover--${post.accent}`}><span>{post.category}</span></div><div className="markdown"><ReactMarkdown>{post.content}</ReactMarkdown></div>{post.ctaType === 'newsletter' && <NewsletterBlock compact />}{post.ctaType === 'diagnostico' && <section className="article-cta"><span className="eyebrow">Vamos conversar?</span><h2>Seu próximo passo <strong>começa aqui.</strong></h2><Link className="button-primary" to={`/blog/diagnostico?origem=${post.slug}`}>Solicitar diagnóstico <ArrowUpRight size={17} /></Link></section>}{post.ctaType === 'material-rico' && post.ctaLink && <section className="article-cta"><span className="eyebrow">Continue explorando</span><h2>Leve essa conversa <strong>adiante.</strong></h2><a className="button-primary" href={post.ctaLink}>Acessar material <ArrowUpRight size={17} /></a></section>}<section className="related-section"><span className="eyebrow">Continue explorando</span><h2>Mais ideias para o seu <strong>movimento.</strong></h2><div className="post-grid">{getRelatedPosts(post.slug).map((related) => <PostCard post={related} key={related.slug} />)}</div></section></article></>
}
