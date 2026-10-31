import { BookOpen, Gauge, House, Newspaper } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

// Atalhos fixos no rodapé da tela, só no celular e tablet (até 900 px): as quatro áreas principais
// sempre visíveis, com ícone e nome, sem precisar abrir o menu. O diagnóstico fica em destaque.
const itens = [
  { rotulo: 'Início', href: '/blog', Icone: House, exato: true, destaque: false },
  { rotulo: 'Blog', href: '/blog/artigos', Icone: BookOpen, exato: false, destaque: false },
  { rotulo: 'Notícias', href: '/blog/noticias', Icone: Newspaper, exato: false, destaque: false },
  { rotulo: 'Diagnóstico', href: '/blog/diagnostico', Icone: Gauge, exato: false, destaque: true },
]

export function BarraInferior() {
  const { pathname } = useLocation()
  // O painel interno tem a própria navegação.
  if (pathname.startsWith('/blog/admin')) return null
  return <nav className="barra-inferior" aria-label="Atalhos">
    {itens.map(({ rotulo, href, Icone, exato, destaque }) => <NavLink key={href} to={href} end={exato} className={({ isActive }) => ['barra-inferior-item', isActive && 'ativo', destaque && 'destaque'].filter(Boolean).join(' ')}>
      <Icone size={20} aria-hidden="true" />
      <span>{rotulo}</span>
    </NavLink>)}
  </nav>
}
