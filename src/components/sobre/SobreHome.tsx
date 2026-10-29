import { ArrowRight, ArrowUpRight, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { sobreConfig } from '../../config/sobre'
import { getDestaque, getFotosIntercaladas } from '../../data/momentos'

function Faixa({ fotos, reversa = false }: { fotos: ReturnType<typeof getFotosIntercaladas>; reversa?: boolean }) {
  return <div className={reversa ? 'sobre-home-faixa sobre-home-faixa--reversa' : 'sobre-home-faixa'}>
    <div className="sobre-home-faixa-trilho">{[0, 1].map((copia) => <span key={copia} aria-hidden={copia === 1 || undefined}>{fotos.map((foto, i) => <Link to={`/blog/sobre/${foto.slug}`} tabIndex={copia === 1 ? -1 : undefined} key={`${foto.src}-${i}`}><img src={foto.src} alt={copia === 1 ? '' : foto.titulo} loading="lazy" /></Link>)}</span>)}</div>
  </div>
}

export function SobreHome() {
  const content = sobreConfig.home
  const destaque = getDestaque()
  // Fotos intercaladas divididas em duas metades, uma para cada faixa (sentidos opostos).
  const fotos = getFotosIntercaladas()
  const metade = Math.ceil(fotos.length / 2)
  return <section className="sobre-home" id="sobre">
    <div className="sobre-home-luz" aria-hidden="true" />
    <div className="container sobre-home-topo">
      <div>
        <span className="eyebrow">{content.eyebrow}</span>
        <h2>{content.titlePrefix} <strong>{content.titleEmphasis}</strong></h2>
        <p className="sobre-home-intro">{content.description}</p>
        <Link className="button-primary" to="/blog/sobre/quem-somos">{content.aboutLinkLabel} <ArrowRight size={17} /></Link>
      </div>
      <dl className="sobre-home-numeros">{content.stats.map((item) => <div key={item.label}><dd>{item.value}</dd><dt>{item.label}</dt></div>)}</dl>
    </div>

    {fotos.length > 0 && <div className="sobre-home-faixas">
      <Faixa fotos={fotos.slice(0, metade)} />
      <Faixa fotos={fotos.slice(metade)} reversa />
    </div>}

    <div className="container sobre-home-base">
      {destaque && <Link className="sobre-home-conquista" to={`/blog/sobre/${destaque.slug}`}>
        <span className="sobre-home-conquista-icone" aria-hidden="true"><Trophy size={20} /></span>
        <span><small>{content.highlightEyebrow}</small><strong>{destaque.title}</strong></span>
        <ArrowUpRight size={18} aria-hidden="true" />
      </Link>}
      <Link className="text-link" to="/blog/sobre">{content.highlightsTitle} <ArrowRight size={15} /></Link>
    </div>
  </section>
}

export function SobreImageCard({ src, alt, fallback }: { src: string; alt: string; fallback: string }) {
  return <div className="sobre-image"><img src={src} alt={alt} width={1200} height={800} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} /><span>{fallback}</span></div>
}
