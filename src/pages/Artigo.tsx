import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getPostBySlug, getRelatedPosts } from '../data/posts'
import { NewsletterBlock } from '../components/newsletter/NewsletterBlock'
import { capaDoPost, PostCard, rotuloDoPost } from '../components/blog/PostCard'
import { SEO } from '../components/layout/SEO'
import { formatarData } from '../lib/datas'

// Checklists dos artigos: o leitor marca e desmarca (só na tela, nada é salvo). O remark-gfm gera a caixa
// desativada; aqui ela fica ativa e o texto do item vira rótulo, para marcar clicando na frase.
const componentesMarkdown: Components = {
  input: ({ node: _node, disabled: _disabled, ...props }) => props.type === 'checkbox' ? <input {...props} defaultChecked={props.checked} checked={undefined} /> : <input {...props} />,
  li: ({ node: _node, className, children, ...props }) => className?.includes('task-list-item') ? <li className={className} {...props}><label>{children}</label></li> : <li className={className} {...props}>{children}</li>,
}

export function Artigo() {
  const { slug } = useParams<{ slug: string }>()
  const post = getPostBySlug(slug)
  if (!post) return <Navigate to="/blog/artigos" replace />
  const capa = capaDoPost(post)
  return <><SEO title={post.title} description={post.metaDescription} type="article" image={capa ? new URL(capa, window.location.origin).href : undefined} /><div className="reading-progress" /><article className="article-page container"><Link className="back-link" to="/blog/artigos"><ArrowLeft size={16} /> Todos os artigos</Link><header className="article-header"><span className="eyebrow">{rotuloDoPost(post)}</span><h1>{post.title}</h1><p>{post.excerpt}</p><div className="article-meta">Por <strong>{post.author}</strong> <i>•</i> {formatarData(post.date)} <i>•</i> {post.readTime}</div></header><div className={`article-cover article-cover--${post.accent}`}>{capa && <img src={capa} alt={post.cover ? post.coverAlt : ""} />}<span>{rotuloDoPost(post)}</span></div><div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} components={componentesMarkdown}>{post.content}</ReactMarkdown></div>{post.ctaType === 'newsletter' && <NewsletterBlock compact />}{post.ctaType === 'diagnostico' && <section className="article-cta"><span className="eyebrow">Vamos conversar?</span><h2>Seu próximo passo <strong>começa aqui.</strong></h2><Link className="button-primary" to={`/blog/diagnostico?origem=${post.slug}`}>Faça seu diagnóstico <ArrowUpRight size={17} /></Link></section>}{post.ctaType === 'material-rico' && post.ctaLink && <section className="article-cta"><span className="eyebrow">Continue explorando</span><h2>Leve essa conversa <strong>adiante.</strong></h2><a className="button-primary" href={post.ctaLink}>Acessar material <ArrowUpRight size={17} /></a></section>}<section className="related-section"><span className="eyebrow">Continue explorando</span><h2>Mais ideias para o seu <strong>movimento.</strong></h2><div className="post-grid">{getRelatedPosts(post.slug).map((related, index) => <PostCard post={related} position={index + 1} key={related.slug} />)}</div></section></article></>
}
