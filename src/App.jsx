import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Check, Linkedin, Menu, MoveUpRight, X } from 'lucide-react'
import { getPostBySlug, posts } from './data/posts'

const accentClasses = {
  lime: 'post-card--lime',
  blue: 'post-card--blue',
  orange: 'post-card--orange',
}

function Logo() {
  return <Link className="logo" to="/blog" aria-label="CITi Blog, início"><span>CITi</span><i>blog</i></Link>
}

function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const isArticle = location.pathname !== '/blog'
  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav className={open ? 'main-nav main-nav--open' : 'main-nav'} aria-label="Navegação principal">
          <Link className={location.pathname === '/blog' ? 'active' : ''} to="/blog" onClick={() => setOpen(false)}>Artigos</Link>
          <a href="#sobre" onClick={() => setOpen(false)}>Sobre o CITi</a>
          <a href="#newsletter" onClick={() => setOpen(false)}>Newsletter</a>
        </nav>
        <div className="header-actions">
          <a className="social-link" href="https://www.linkedin.com/company/citi-ufpe/" target="_blank" rel="noreferrer" aria-label="LinkedIn do CITi"><Linkedin size={17} /></a>
          <button className="menu-button" onClick={() => setOpen(!open)} aria-label={open ? 'Fechar menu' : 'Abrir menu'}>{open ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </div>
      {isArticle && <div className="reading-progress" />}
    </header>
  )
}

function Tag({ children, color = 'lime' }) {
  return <span className={`tag tag--${color}`}>{children}</span>
}

function Footer() {
  return <footer className="site-footer" id="sobre">
    <div className="footer-grid">
      <div><Logo /><p>Ideias que movem negócios.<br />Tecnologia que aproxima pessoas.</p></div>
      <div className="footer-note"><span className="mono-label">CITi / UFPE / CIn</span><p>Uma empresa júnior de tecnologia feita por estudantes que gostam de construir o próximo passo.</p></div>
      <div className="footer-arrow"><MoveUpRight size={42} strokeWidth={1.2} /></div>
    </div>
    <div className="footer-bottom"><span>© 2024 CITi. Recife, PE.</span><span>Feito com curiosidade.</span></div>
  </footer>
}

function Newsletter() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  function submit(event) { event.preventDefault(); if (email.trim()) setSent(true) }
  return <section className="newsletter" id="newsletter">
    <div><span className="eyebrow">Uma carta de vez em quando</span><h2>Boas ideias não precisam<br /><em>gritar.</em></h2></div>
    {sent ? <div className="newsletter-success"><Check size={18} /> Obrigado. A próxima edição é sua.</div> : <form onSubmit={submit} className="newsletter-form"><label htmlFor="email">Seu melhor e-mail</label><div><input id="email" type="email" required placeholder="voce@empresa.com" value={email} onChange={(event) => setEmail(event.target.value)} /><button aria-label="Assinar newsletter" type="submit"><ArrowUpRight size={20} /></button></div></form>}
  </section>
}

function PostCard({ post, featured = false }) {
  return <Link to={`/blog/${post.slug}`} className={`post-card ${accentClasses[post.accent] || ''} ${featured ? 'post-card--featured' : ''}`}>
    <div className="card-visual"><span className="card-index">{featured ? '01' : post.category === 'Design' ? '02' : '03'}</span><ArrowUpRight className="card-arrow" size={22} /><div className="visual-shape" /></div>
    <div className="card-copy"><div className="card-meta"><Tag color={post.accent}>{post.category}</Tag><span>{post.readTime}</span></div><h3>{post.title}</h3><p>{post.excerpt}</p><span className="read-link">Ler artigo <ArrowDownRight size={16} /></span></div>
  </Link>
}

function BlogHome() {
  const [filter, setFilter] = useState('Todos')
  const categories = ['Todos', ...new Set(posts.map((post) => post.category))]
  const filteredPosts = filter === 'Todos' ? posts : posts.filter((post) => post.category === filter)
  const featured = filteredPosts.find((post) => post.featured) || filteredPosts[0]
  const rest = filteredPosts.filter((post) => post.slug !== featured?.slug)
  return <>
    <Helmet><title>Blog CITi | Ideias que movem negócios</title><meta name="description" content="Tecnologia, design e estratégia para negócios em movimento." /></Helmet>
    <main>
      <section className="hero"><div className="hero-kicker"><span className="dot" /> Blog CITi <span className="slash">/</span> Tecnologia com propósito</div><h1>Ideias para<br /><em>mover</em> negócios.</h1><p className="hero-intro">Tecnologia, design e estratégia para quem acredita que o próximo passo começa com uma boa pergunta.</p><div className="hero-mark"><ArrowDownRight size={26} /><span>Explore os artigos</span></div></section>
      <section className="featured-section"><div className="section-heading"><span className="eyebrow">Em destaque</span><span className="section-count">01 — {String(posts.length).padStart(2, '0')}</span></div>{featured && <PostCard post={featured} featured />}</section>
      <section className="archive-section"><div className="section-heading"><span className="eyebrow">Mais para explorar</span><div className="filter-list">{categories.map((category) => <button className={filter === category ? 'filter active' : 'filter'} key={category} onClick={() => setFilter(category)}>{category}</button>)}</div></div><div className="posts-grid">{rest.map((post) => <PostCard post={post} key={post.slug} />)}</div></section>
      <Newsletter />
    </main><Footer />
  </>
}

function ArticlePage() {
  const { slug } = useParams()
  const post = getPostBySlug(slug)
  if (!post) return <Navigate to="/blog" replace />
  return <><Helmet><title>{post.title} | Blog CITi</title><meta name="description" content={post.excerpt} /></Helmet><main className="article-page"><Link className="back-link" to="/blog"><ArrowLeft size={17} /> Voltar para artigos</Link><div className="article-intro"><Tag color={post.accent}>{post.category}</Tag><h1>{post.title}</h1><p className="article-excerpt">{post.excerpt}</p><div className="article-byline"><span>Por <strong>{post.author}</strong></span><span>{post.date} <i>•</i> {post.readTime}</span></div></div><div className={`article-art article-art--${post.accent}`}><div className="article-art-letter">{post.category.slice(0, 1)}</div><span>IDEIAS EM<br />MOVIMENTO</span></div><article className="markdown"><ReactMarkdown>{post.content}</ReactMarkdown></article><div className="article-end"><span>Fim da leitura</span><Link to="/blog">Ver outros artigos <ArrowUpRight size={17} /></Link></div></main><Newsletter /><Footer /></>
}

export default function App() { return <><Header /><Routes><Route path="/" element={<Navigate to="/blog" replace />} /><Route path="/blog" element={<BlogHome />} /><Route path="/blog/:slug" element={<ArticlePage />} /></Routes></> }
