import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { NewsItem } from '../data/noticias'

export function NewsSidebar({ items }: { items: NewsItem[] }) {
  return <aside className="news-sidebar"><div className="section-heading"><span className="eyebrow">Radar da semana</span><h2>O que está<br /><strong>movendo.</strong></h2></div>{items.slice(0, 5).map((item, index) => <Link className="news-teaser" to={`/blog/noticias#${item.slug}`} key={item.slug}><b>{String(index + 1).padStart(2, '0')}</b><span><small>{item.category}</small>{item.title}</span></Link>)}<Link className="text-link" to="/blog/noticias">Ver todas as notícias <ArrowUpRight size={16} /></Link></aside>
}
