import { useSearchParams } from 'react-router-dom'
import { categories, getCategory } from '../data/categorias'
import { subtemas } from '../data/subtemas'
import { posts } from '../data/posts'
import { CategoryPills } from '../components/CategoryPills'
import { PostCard } from '../components/PostCard'
import { SEO } from '../components/SEO'
import LuzAmbiente from '../components/LuzAmbiente'

export function Artigos() {
  const [params] = useSearchParams()
  const active = params.get('categoria') ?? undefined
  const category = getCategory(active)
  const filtered = active ? posts.filter((post) => post.categorySlug === active) : posts
  const availableSubtemas = active ? subtemas.map((subtema) => ({ ...subtema, count: posts.filter((post) => post.categorySlug === active && post.subtema === subtema.slug).length })).filter((subtema) => subtema.count > 0) : []
  return <><SEO title="Artigos" description={category?.description ?? 'Tecnologia, design e estratégia para negócios em movimento.'} /><section className="page-banner page-banner--ambient"><LuzAmbiente /><div className="page-banner-fade" aria-hidden="true" /><div className="page-banner-content container"><div className="page-banner-layout"><div className="page-banner-copy"><span className="eyebrow">Blog</span><h1>Ideias para <strong>mover decisões.</strong></h1><p>{category?.description ?? 'Conteúdos para transformar boas perguntas em próximos passos.'}</p></div></div><CategoryPills active={active} />{availableSubtemas.length > 0 && <div className="subtema-pills" aria-label="Subtemas">{availableSubtemas.map((subtema) => <span className="subtema-pill" key={subtema.slug}>{subtema.label} <b>{subtema.count}</b></span>)}</div>}</div></section><section className="listing-section container"><div className="listing-header"><span>{filtered.length} {filtered.length === 1 ? 'artigo' : 'artigos'}</span>{active && <span>Categoria: {category?.label ?? active}</span>}</div>{filtered.length ? <div className="post-grid">{filtered.map((post, index) => <PostCard post={post} position={index + 1} key={post.slug} />)}</div> : <div className="empty-state"><h2>Nenhum artigo nesta categoria ainda.</h2><p>Escolha outro tema para continuar explorando.</p><CategoryPills /></div>}</section></>
}
