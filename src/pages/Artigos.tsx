import { lazy, Suspense, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { categories, getCategory } from '../data/categorias'
import { getSubtema, subtemas } from '../data/subtemas'
import { posts } from '../data/posts'
import { PostCard, PostDestaque } from '../components/blog/PostCard'
import { NewsletterBlock } from '../components/newsletter/NewsletterBlock'
import { SEO } from '../components/layout/SEO'

// O fundo animado só carrega nesta página.
const FundoFitas = lazy(() => import('../components/efeitos/FundoFitas'))

const minutos = (texto: string) => Number.parseInt(texto, 10) || 0

export function Artigos() {
  const [params, setParams] = useSearchParams()
  const categoria = getCategory(params.get('categoria') ?? undefined)
  const subtema = getSubtema(params.get('subtema') ?? undefined)
  const subtemaAtivo = subtema && subtema.parentSlug === categoria?.slug ? subtema : undefined
  const filtrados = useMemo(() => posts.filter((post) => (!categoria || post.categorySlug === categoria.slug) && (!subtemaAtivo || post.subtema === subtemaAtivo.slug)), [categoria, subtemaAtivo])
  // Sem filtro, o destaque é o artigo marcado como `featured`; com filtro, o mais recente do recorte.
  const destaque = categoria ? filtrados[0] : posts.find((post) => post.featured) ?? posts[0]
  const demais = filtrados.filter((post) => post !== destaque)
  const contar = (categoriaSlug: string, subtemaSlug?: string) => posts.filter((post) => post.categorySlug === categoriaSlug && (!subtemaSlug || post.subtema === subtemaSlug)).length
  const temas = new Set(posts.map((post) => post.subtema).filter(Boolean)).size
  const leituraMedia = posts.length ? Math.round(posts.reduce((total, post) => total + minutos(post.readTime), 0) / posts.length) : 0
  const subtemasDaCategoria = categoria ? subtemas.filter((item) => item.parentSlug === categoria.slug && contar(categoria.slug, item.slug) > 0) : []

  const filtrar = (categoriaSlug: string, subtemaSlug = '', botao?: HTMLElement) => {
    setParams(categoriaSlug ? { categoria: categoriaSlug, ...(subtemaSlug && { subtema: subtemaSlug }) } : {}, { replace: true, preventScrollReset: true })
    botao?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  const titulo = subtemaAtivo?.label ?? categoria?.label
  return <><SEO title={titulo ? `${titulo}: artigos` : 'Artigos'} description={categoria?.description ?? 'Artigos sobre marketing, vendas, dados, desenvolvimento, inovação, experiência do cliente e gestão para empresas que querem crescer com tecnologia.'} />
    <section className="page-banner page-banner--ambient news-banner blog-banner">
      <Suspense fallback={null}><FundoFitas /></Suspense>
      <div className="page-banner-fade" aria-hidden="true" />
      <div className="page-banner-content container">
        <span className="news-live"><BookOpen size={14} aria-hidden="true" /> Blog do CITi · {posts.length} artigos</span>
        <h1>Ideias para <strong>mover decisões.</strong></h1>
        <p>Marketing, vendas, dados, desenvolvimento e gestão explicados a partir do problema de negócio, não da ferramenta.</p>
        <dl className="news-stats">
          <div><dt>Artigos</dt><dd>{posts.length}</dd></div>
          <div><dt>Temas</dt><dd>{temas}</dd></div>
          <div><dt>Leitura média</dt><dd>{leituraMedia} min</dd></div>
        </dl>
      </div>
    </section>

    <section className="news-layout container">
      <div className="news-main">
        <div className="news-filters blog-filters" role="group" aria-label="Filtrar por categoria">
          <div className="blog-filters-linha">
            <button type="button" className={!categoria ? 'news-filter active' : 'news-filter'} aria-pressed={!categoria} onClick={(event) => filtrar('', '', event.currentTarget)}>Todos <b>{posts.length}</b></button>
            {categories.map((item) => <button type="button" key={item.slug} className={categoria?.slug === item.slug ? 'news-filter active' : 'news-filter'} aria-pressed={categoria?.slug === item.slug} onClick={(event) => filtrar(item.slug, '', event.currentTarget)}>{item.label} <b>{contar(item.slug)}</b></button>)}
          </div>
          {subtemasDaCategoria.length > 0 && <div className="blog-filters-linha blog-filters-sub" role="group" aria-label={`Subtemas de ${categoria?.label}`}>
            {subtemasDaCategoria.map((item) => <button type="button" key={item.slug} className={subtemaAtivo?.slug === item.slug ? 'news-filter active' : 'news-filter'} aria-pressed={subtemaAtivo?.slug === item.slug} onClick={(event) => filtrar(categoria!.slug, subtemaAtivo?.slug === item.slug ? '' : item.slug, event.currentTarget)}>{item.label} <b>{contar(categoria!.slug, item.slug)}</b></button>)}
          </div>}
        </div>
        <p className="sr-only" aria-live="polite">{filtrados.length} artigos</p>

        {!destaque && <div className="news-empty"><h2>Nenhum artigo neste tema ainda.</h2><p>Escolha outro tema para continuar explorando.</p><button type="button" className="button-secondary" onClick={() => filtrar('')}>Ver todos</button></div>}
        {destaque && <PostDestaque post={destaque} key={`destaque-${destaque.slug}`} />}
        {demais.length > 0 && <div className="post-grid blog-grid">{demais.map((post, index) => <PostCard post={post} position={index + 2} key={`${categoria?.slug}-${post.slug}`} />)}</div>}
      </div>

      <aside className="news-aside">
        <NewsletterBlock compact />
      </aside>
    </section>
  </>
}
