import { ArrowUpRight, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { sobreConfig } from '../../config/sobre'
import { getDestaque } from '../../data/momentos'

function SobreImage({ src, alt, fallback, width, height }: { src: string; alt: string; fallback: string; width: number; height: number }) {
  return <div className="sobre-home-image"><img src={src} alt={alt} width={width} height={height} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} /><span>{fallback}</span></div>
}

export function SobreHome() {
  const content = sobreConfig.home
  const highlight = getDestaque()
  const target = highlight && !highlight.draft ? `/blog/sobre/${highlight.slug}` : '/blog/sobre'
  return <section className="sobre-home" id="sobre"><div className="sobre-home-orb" aria-hidden="true" /><div className="container sobre-home-inner"><span className="eyebrow">{content.eyebrow}</span><h2>{content.titlePrefix} <strong>{content.titleEmphasis}</strong></h2><p className="sobre-home-intro">{content.description}</p><article className="sobre-home-feature"><figure><div className="sobre-home-photo-glow" aria-hidden="true" /><div className="sobre-home-photo"><SobreImage src={content.image} alt={content.imageAlt} fallback={content.imageFallback} width={1600} height={1000} /><div className="sobre-home-photo-caption"><span className="eyebrow">{content.highlightEyebrow}</span><p>{content.highlightsTitle}</p></div></div></figure><div className="sobre-home-feature-copy"><span className="sobre-home-feature-label"><i />{content.highlightEyebrow}</span><h3>{content.highlightTitle}</h3><p>{content.highlightText}</p><div className="sobre-home-metric"><span><Users size={20} /></span><p><strong>{content.highlightMetric}</strong> {content.highlightMetricText}</p></div><Link className="sobre-home-conquest" to={target}>{content.highlight.linkLabel} <ArrowUpRight size={17} /></Link></div></article><ol className="sobre-home-journey-list">{content.journey.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong></li>)}</ol><Link className="sobre-home-link" to="/blog/sobre/quem-somos">{content.aboutLinkLabel} <ArrowRightIcon /></Link></div></section>
}

function ArrowRightIcon() { return <span aria-hidden="true">→</span> }

export function SobreImageCard({ src, alt, fallback }: { src: string; alt: string; fallback: string }) {
  return <div className="sobre-image"><img src={src} alt={alt} width={1200} height={800} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} /><span>{fallback}</span></div>
}
