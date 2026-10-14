import { ArrowRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { SEO } from '../components/SEO'
import { formatarData } from '../lib/datas'
import { getMomentos, getTipos } from '../data/momentos'
import { sobreConfig } from '../config/sobre'
import { SobreCarrossel } from '../components/sobre/SobreCarrossel'

export function Momentos() {
  const [params] = useSearchParams()
  const activeType = params.get('tipo') ?? undefined
  const content = sobreConfig.momentos
  const momentos = getMomentos()
  const tipos = getTipos()
  const filtered = activeType ? momentos.filter((momento) => momento.tipo === activeType) : momentos
  return <><SEO title={content.title} description={content.description} /><SobreCarrossel /><section className="momentos-intro container"><span className="eyebrow">{content.eyebrow}</span><h1>{content.titlePrefix} <strong>{content.titleEmphasis}</strong></h1><p>{content.description}</p><Link className="text-link" to="/blog/sobre/quem-somos">{content.quemSomosLabel} <ArrowRight size={15} /></Link></section><section className="momentos-news container"><div className="momentos-news-header"><div><span className="eyebrow">{content.newsEyebrow}</span><h2>{content.newsTitle}</h2></div><div className="category-pills momentos-filters" aria-label="Filtrar momentos"><Link className={!activeType ? 'pill active' : 'pill'} to="/blog/sobre">{content.allLabel}</Link>{tipos.map((tipo) => <Link className={activeType === tipo ? 'pill active' : 'pill'} to={`/blog/sobre?tipo=${tipo}`} key={tipo}>{content.typeLabels[tipo]}</Link>)}</div></div><div className="listing-header"><span>{filtered.length} {content.countLabel}</span></div>{filtered.length ? <div className="momentos-news-list">{filtered.map((momento) => <Link className="momento-news-item" to={`/blog/sobre/${momento.slug}`} key={momento.slug}><div className="momento-news-image"><img src={momento.capa} alt={momento.capaAlt} width={1200} height={750} loading="lazy" /></div><div className="momento-news-copy"><div className="post-meta"><span>{content.typeLabels[momento.tipo]}</span><i>•</i>{formatarData(momento.date)}</div><h2>{momento.title}</h2><p>{momento.resumo}</p><span className="text-link">{content.cardCta} <ArrowRight size={15} /></span></div></Link>)}</div> : <div className="momentos-empty">{content.empty}</div>}</section><section className="momentos-method"><div className="container"><h2>{content.methodTitle} <strong>{content.methodEmphasis}</strong></h2><div className="momentos-method-grid">{sobreConfig.page.method.map((item) => <article key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></div></section><section className="momentos-cta container"><div><span className="eyebrow">{sobreConfig.page.ctaTitle}</span><h2>{sobreConfig.page.ctaText}</h2><Link className="button-primary" to={sobreConfig.page.ctaLink}>{content.ctaLabel} <ArrowRight size={17} /></Link></div></section></>
}
