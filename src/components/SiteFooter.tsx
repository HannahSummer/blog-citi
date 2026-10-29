import { ArrowUp, ArrowUpRight, Instagram, Linkedin, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { siteConfig } from '../config/site'

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="footer-grid">
      <div className="footer-marca">
        <Link className="logo" to="/blog"><img src="/assets/logo-citi.png" alt="CITi" /></Link>
        <p>Ideias que movem negócios.<br />Tecnologia que aproxima pessoas.</p>
        <Link className="footer-cta" to="/blog/diagnostico">Faça seu diagnóstico <ArrowUpRight size={15} /></Link>
      </div>
      <div><span className="eyebrow">Navegue</span><div className="footer-links">{siteConfig.menu.map((item) => <Link to={item.href} key={item.href}>{item.label}</Link>)}</div></div>
      <div className="footer-contact">
        <span className="eyebrow">CITi / UFPE / CIn</span>
        <div className="footer-sociais">
          <a className="footer-social" href={siteConfig.instagram} target="_blank" rel="noreferrer"><Instagram size={16} /> Instagram <ArrowUpRight size={14} /></a>
          <a className="footer-social" href={siteConfig.linkedin} target="_blank" rel="noreferrer"><Linkedin size={16} /> LinkedIn <ArrowUpRight size={14} /></a>
        </div>
        <p><MapPin size={15} aria-hidden="true" /> Centro de Informática da UFPE<br />Recife-PE</p>
      </div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} CITi · Feito com curiosidade.</span><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Voltar ao topo <ArrowUp size={14} /></button></div>
  </footer>
}
