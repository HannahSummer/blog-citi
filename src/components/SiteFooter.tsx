import { ArrowUpRight, Linkedin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { siteConfig } from '../config/site'

export function SiteFooter() {
  return <footer className="site-footer"><div className="footer-grid"><div><Link className="logo" to="/blog"><img src="/assets/logo-citi.png" alt="CITi" /></Link><p>Ideias que movem negócios.<br />Tecnologia que aproxima pessoas.</p></div><div><span className="eyebrow">Navegue</span><div className="footer-links">{siteConfig.menu.map((item) => <Link to={item.href} key={item.href}>{item.label}</Link>)}</div></div><div className="footer-contact"><span className="eyebrow">CITi / UFPE / CIn</span><a href={siteConfig.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn do CITi"><Linkedin size={18} /></a><p>Recife-PE · {new Date().getFullYear()}</p></div></div><div className="footer-bottom"><span>Feito com curiosidade.</span><Link to="/blog">Voltar ao início <ArrowUpRight size={15} /></Link></div></footer>
}
