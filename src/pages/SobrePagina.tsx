import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SEO } from '../components/layout/SEO'
import { SobreImageCard } from '../components/sobre/SobreHome'
import { sobreConfig } from '../config/sobre'
import { getMomentos } from '../data/momentos'
import { formatarData } from '../lib/datas'

export function SobrePagina() {
  const content = sobreConfig.page
  const stats = sobreConfig.home.stats
  const momentos = getMomentos().slice(0, 3)
  return <><SEO title={content.eyebrow} description={content.description} /><section className="sobre-page">
    <div className="sobre-page-hero container"><div className="sobre-page-hero-media"><img src={content.heroImage} alt={content.heroImageAlt} width={1600} height={1000} ref={(element) => { element?.setAttribute('fetchpriority', 'high') }} onError={(event) => { event.currentTarget.style.display = 'none' }} /><span>{content.heroFallback}</span></div><div className="sobre-page-hero-copy"><span className="eyebrow">{content.eyebrow}</span><h1>{content.title}</h1><p>{content.description}</p></div></div>

    <section className="sobre-projects sobre-quem container">
      <span className="eyebrow">{content.whoEyebrow}</span>
      <h2>{content.whoTitle}</h2>
      <div className="sobre-quem-grid">
        <div className="sobre-quem-texto">{content.whoParagraphs.map((paragrafo) => <p key={paragrafo}>{paragrafo}</p>)}</div>
        <dl className="sobre-quem-numeros">{stats.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
      </div>
    </section>

    <section className="sobre-method section-glow"><div className="container"><span className="eyebrow">{content.methodTitle}</span><h2>{content.methodDescription}</h2><div className="sobre-method-grid">{content.method.map((item) => <article className="method-card" key={item.number}><span className="ghost-number">{item.number}</span><span className="eyebrow">{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></div></section>

    {momentos.length > 0 && <section className="sobre-projects container">
      <span className="eyebrow">{content.momentosStripTitle}</span>
      <div className="post-grid sobre-momentos-grid">{momentos.map((item) => <Link className="momento-card" to={`/blog/sobre/${item.slug}`} key={item.slug}><div className="momento-card-cover"><img src={item.capa} alt={item.capaAlt} width={1200} height={675} loading="lazy" /></div><div className="momento-card-body"><span className="post-meta">{sobreConfig.momentos.typeLabels[item.tipo]} <i>•</i> {formatarData(item.date)}</span><h2>{item.title}</h2><p>{item.resumo}</p></div></Link>)}</div>
      <div className="sobre-momentos-link"><Link className="text-link" to={content.momentosLink}>{content.momentosLinkLabel} <ArrowUpRight size={15} /></Link></div>
    </section>}

    <section className="sobre-gallery container"><span className="eyebrow">{content.galleryTitle}</span><div className="sobre-gallery-grid">{content.gallery.map((image) => <SobreImageCard key={image.src} src={image.src} alt={image.alt} fallback={image.fallback} />)}</div></section>
    <section className="sobre-page-cta container"><span className="eyebrow">{content.ctaTitle}</span><h2>{content.ctaText}</h2><Link className="button-primary" to={content.ctaLink}>{content.ctaLabel} <ArrowUpRight size={17} /></Link></section>
  </section></>
}
