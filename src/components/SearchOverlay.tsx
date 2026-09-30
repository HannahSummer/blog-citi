import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { news } from '../data/noticias'
import { posts } from '../data/posts'

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (open) { setQuery(''); inputRef.current?.focus() } }, [open])
  if (!open) return null
  const normalized = query.toLowerCase().trim()
  const articleResults = posts.filter((post) => `${post.title} ${post.excerpt} ${post.category}`.toLowerCase().includes(normalized)).slice(0, 5)
  const newsResults = news.filter((item) => `${item.title} ${item.summary} ${item.category}`.toLowerCase().includes(normalized)).slice(0, 5)
  return <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Buscar no blog"><div className="search-box"><button className="icon-button search-close" onClick={onClose} aria-label="Fechar busca"><X /></button><label htmlFor="site-search"><Search size={18} /> Buscar no Blog CITi</label><input ref={inputRef} id="site-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Digite uma palavra ou tema" onKeyDown={(event) => event.key === 'Escape' && onClose()} />{query && <div className="search-results"><div><h2>Artigos</h2>{articleResults.map((post) => <Link onClick={onClose} to={`/blog/artigos/${post.slug}`} key={post.slug}>{post.title}<small>{post.category}</small></Link>)}</div><div><h2>Notícias</h2>{newsResults.map((item) => <Link onClick={onClose} to={`/blog/noticias#${item.slug}`} key={item.slug}>{item.title}<small>{item.category}</small></Link>)}</div></div>}</div></div>
}
