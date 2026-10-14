import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { siteConfig } from '../config/site'
import { news } from '../data/noticias'
import { posts } from '../data/posts'
import { CategoryPills } from '../components/CategoryPills'
import { FeaturedPost, PostCard } from '../components/PostCard'
import { NewsSidebar } from '../components/NewsSidebar'
import { NewsletterBlock } from '../components/NewsletterBlock'
import { SEO } from '../components/SEO'
import HeroImagemGirando from '../components/HeroImagemGirando'
import { SobreHome } from '../components/sobre/SobreHome'

export function Home() {
  const featured = posts.find((post) => post.featured) ?? posts[0]
  return <><SEO title="Ideias que movem negócios" description={siteConfig.hero.description} /><section className="hero"><HeroImagemGirando src={`${import.meta.env.BASE_URL}assets/background-head.webp`} /><div className="hero-overlay" aria-hidden="true" /><div className="hero-content"><span className="eyebrow">{siteConfig.hero.eyebrow}</span><h1>{siteConfig.hero.title}<br /><strong>{siteConfig.hero.emphasis}</strong></h1><p>{siteConfig.hero.description}</p><CategoryPills /></div></section><section className="methodology section-glow" id="metodologia"><div className="container"><span className="eyebrow">{siteConfig.methodology.eyebrow}</span><h2 className="title-mix">Começamos pelo <strong>problema.</strong><br />Depois, a <strong>tecnologia.</strong></h2><p className="intro-copy">{siteConfig.methodology.description}</p><div className="methodology-grid">{siteConfig.methodology.cards.map(([label, title, text], index) => <article className="method-card" key={title}><span className="ghost-number">{index + 1}</span><span className="eyebrow">{label}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section><section className="portal-section container"><div className="portal-top"><div className="portal-main"><span className="eyebrow">Em destaque</span>{featured && <FeaturedPost post={featured} />}</div><NewsSidebar items={news} /></div><div className="latest-posts"><div className="section-heading-row"><div><span className="eyebrow">Últimos artigos</span><h2>Para ler no seu <strong>próximo intervalo.</strong></h2></div><Link className="button-secondary" to="/blog/artigos">Ver todos <ArrowRight size={16} /></Link></div><div className="post-grid">{posts.filter((post) => post.slug !== featured?.slug).slice(0, 4).map((post, index) => <PostCard post={post} position={index + 1} key={post.slug} />)}</div></div></section><SobreHome /><NewsletterBlock /></>
}
