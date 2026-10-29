import { lazy, Suspense } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { siteConfig } from '../config/site'
import { useNoticias } from '../hooks/useNoticias'
import { posts } from '../data/posts'
import { categories } from '../data/categorias'
import { subtemas } from '../data/subtemas'
import { PostCard, PostDestaque } from '../components/PostCard'
import { NewsSidebar } from '../components/NewsSidebar'
import { NewsletterBlock } from '../components/NewsletterBlock'
import { SEO } from '../components/SEO'
import HeroImagemGirando from '../components/HeroImagemGirando'
import { SobreHome } from '../components/sobre/SobreHome'
import { MetodoHome } from '../components/MetodoHome'

// O globo (d3 + mapa) só é baixado quando a Home é aberta.
const GloboNoticias = lazy(() => import('../components/GloboNoticias'))

const contar = (categoria: string, subtema?: string) => posts.filter((post) => post.categorySlug === categoria && (!subtema || post.subtema === subtema)).length

export function Home() {
  const featured = posts.find((post) => post.featured) ?? posts[0]
  const news = useNoticias()
  const { hero, home } = siteConfig
  return <><SEO title="Ideias que movem negócios" description={hero.description} />
    <section className="hero">
      <HeroImagemGirando src={`${import.meta.env.BASE_URL}assets/background-head.webp`} intensidade={1.5} velocidade={1.4} />
      <div className="hero-overlay" aria-hidden="true" />
      <div className="hero-content">
        <span className="eyebrow">{hero.eyebrow}</span>
        <h1>{hero.title}<br /><strong>{hero.emphasis}</strong></h1>
        <p>{hero.description}</p>
        <div className="home-hero-acoes">
          <Link className="button-primary" to="/blog/artigos">Explorar artigos <ArrowRight size={17} /></Link>
          <Link className="button-secondary" to="/blog/diagnostico">Faça seu diagnóstico <ArrowUpRight size={16} /></Link>
        </div>
      </div>
      <div className="home-temas-faixa" aria-hidden="true">
        <div className="home-temas-trilho">{[0, 1].map((copia) => <span key={copia}>{subtemas.map((item) => <i key={item.slug}>{item.label}</i>)}</span>)}</div>
      </div>
    </section>

    <MetodoHome />

    <section className="home-destaque container">
      <div className="section-heading-row"><div><span className="eyebrow">{home.featuredEyebrow}</span><h2>{home.featuredTitle} <strong>{home.featuredEmphasis}</strong></h2></div><Link className="button-secondary" to="/blog/artigos">Ver todos os artigos <ArrowRight size={16} /></Link></div>
      {featured && <PostDestaque post={featured} />}
      <div className="home-artigos-fileira">{posts.filter((post) => post.slug !== featured?.slug).slice(0, 4).map((post, index) => <PostCard post={post} position={index + 1} compacto key={post.slug} />)}</div>
    </section>

    <section className="home-temas container" aria-labelledby="home-temas-titulo">
      <span className="eyebrow">{home.themesEyebrow}</span>
      <h2 id="home-temas-titulo">{home.themesTitle} <strong>{home.themesEmphasis}</strong></h2>
      <div className="home-temas-grid">{categories.map((categoria) => <article className={`home-tema home-tema--${categoria.slug}`} key={categoria.slug}>
        <img src={categoria.capaPadrao} alt="" loading="lazy" />
        <div className="home-tema-conteudo">
          <span className="home-tema-total">{contar(categoria.slug)} artigos</span>
          <h3><Link to={`/blog/artigos?categoria=${categoria.slug}`}>{categoria.label} <ArrowUpRight size={20} /></Link></h3>
          <p>{categoria.description}</p>
          <ul>{subtemas.filter((item) => item.parentSlug === categoria.slug).map((item) => {
            const total = contar(categoria.slug, item.slug)
            return <li key={item.slug}>{total ? <Link to={`/blog/artigos?categoria=${categoria.slug}&subtema=${item.slug}`}>{item.label} <b>{total}</b></Link> : <span>{item.label}</span>}</li>
          })}</ul>
        </div>
      </article>)}</div>
    </section>

    <section className="home-radar">
      <div className="container home-radar-grid">
        <NewsSidebar items={news} />
        <div className="home-radar-globo">
          <Suspense fallback={<div className="globo" aria-hidden="true" />}><GloboNoticias noticias={news} decorativo /></Suspense>
        </div>
      </div>
    </section>

    <SobreHome />
    <NewsletterBlock />
  </>
}
