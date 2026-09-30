import { Menu, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { siteConfig } from '../config/site'
import { SearchOverlay } from './SearchOverlay'

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()
  const closeMenu = () => setMenuOpen(false)
  useEffect(() => { document.body.classList.toggle('menu-is-open', menuOpen); return () => document.body.classList.remove('menu-is-open') }, [menuOpen])
  useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') { event.preventDefault(); setSearchOpen(true) } if (event.key === 'Escape') setMenuOpen(false) }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler) }, [])
  return <><header className="site-header"><div className="header-inner"><Link className="logo" to="/blog" aria-label="CITi Blog, início"><img src="/assets/logo-citi.png" alt="CITi" /></Link><nav className={menuOpen ? 'main-nav main-nav-open' : 'main-nav'} aria-label="Navegação principal">{siteConfig.menu.map((item) => <Link className={location.pathname + location.hash === item.href ? 'active' : ''} to={item.href} onClick={closeMenu} key={item.href}>{item.label}</Link>)}<button className="search-trigger" onClick={() => setSearchOpen(true)} aria-label="Abrir busca"><Search size={18} /></button><Link className="header-cta" to="/blog/diagnostico" onClick={closeMenu}>Solicitar diagnóstico</Link></nav><div className="mobile-actions"><button className="icon-button" onClick={() => setSearchOpen(true)} aria-label="Abrir busca"><Search size={19} /></button><button className="icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button></div></div></header><SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} /></>
}
