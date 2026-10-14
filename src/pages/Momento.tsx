import ReactMarkdown from 'react-markdown'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { SEO } from '../components/SEO'
import { formatarData } from '../lib/datas'
import { getMomentoBySlug, getMomentos } from '../data/momentos'
import { sobreConfig } from '../config/sobre'

export function Momento() {
  const { slug } = useParams<{ slug: string }>()
  const momento = getMomentoBySlug(slug)
  if (!momento) return <Navigate to="/blog/sobre" replace />
  const content = sobreConfig.momentos
  const related = getMomentos().filter((item) => item.slug !== momento.slug && item.tipo === momento.tipo).concat(getMomentos().filter((item) => item.slug !== momento.slug && item.tipo !== momento.tipo)).slice(0, 3)
  return <><SEO title={momento.title} description={momento.resumo} type="article" image={momento.capa} /><article className="article-page container momento-page"><Link className="back-link" to="/blog/sobre"><ArrowLeft size={16} /> {content.backLabel}</Link><header className="article-header"><span className="eyebrow">{content.typeLabels[momento.tipo]}</span><h1>{momento.title}</h1><p>{momento.resumo}</p><div className="article-meta">{formatarData(momento.date)}{momento.local && <><i>•</i>{momento.local}</>}</div></header><div className="momento-cover"><img src={momento.capa} alt={momento.capaAlt} width={1600} height={686} /></div><div className="markdown"><ReactMarkdown>{momento.content}</ReactMarkdown>{momento.linkExterno && <a className="button-secondary" href={momento.linkExterno} target="_blank" rel="noopener noreferrer">{content.externalCta} <ArrowUpRight size={15} /></a>}</div>{momento.galeria.length > 0 && <section className="momento-gallery"><div className="momento-gallery-grid">{momento.galeria.map((image) => <figure key={image.src}><a href={image.src} target="_blank" rel="noreferrer"><img src={image.src} alt={image.alt} width={800} height={1000} loading="lazy" /></a><figcaption>{image.legenda}</figcaption></figure>)}</div></section>}{related.length > 0 && <section className="related-section"><span className="eyebrow">{content.relatedTitle}</span><div className="post-grid">{related.map((item) => <Link className="momento-card" to={`/blog/sobre/${item.slug}`} key={item.slug}><div className="momento-card-cover"><img src={item.capa} alt={item.capaAlt} width={1200} height={675} loading="lazy" /></div><div className="momento-card-body"><h2>{item.title}</h2><p>{item.resumo}</p></div></Link>)}</div></section>}<section className="sobre-page-cta momento-cta"><span className="eyebrow">{sobreConfig.page.ctaTitle}</span><h2>{sobreConfig.page.ctaText}</h2><Link className="button-primary" to={sobreConfig.page.ctaLink}>{sobreConfig.page.ctaLabel} <ArrowUpRight size={17} /></Link></section></article></>
}