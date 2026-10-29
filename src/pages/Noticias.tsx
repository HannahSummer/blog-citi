import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Radar } from 'lucide-react'
import { useNoticias } from '../hooks/useNoticias'
import { NewsletterBlock } from '../components/NewsletterBlock'
import { NoticiaCard } from '../components/NoticiaCard'
import { SEO } from '../components/SEO'
import LuzAmbiente from '../components/LuzAmbiente'
import { categories } from '../data/categorias'
import type { NewsItem } from '../data/noticias'
import { formatarData } from '../lib/datas'

// O globo (d3 + mapa) só carrega nesta página.
const GloboNoticias = lazy(() => import('../components/GloboNoticias'))

const DIA = 86_400_000

// Segunda-feira da semana da data (AAAA-MM-DD), em UTC para não variar com o fuso.
function inicioDaSemana(data: string): number {
  const dia = new Date(`${data}T00:00:00Z`)
  if (Number.isNaN(dia.getTime())) return 0
  return dia.getTime() - ((dia.getUTCDay() + 6) % 7) * DIA
}

function rotuloDaSemana(inicio: number): string {
  const hoje = new Date()
  const atual = inicioDaSemana(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`)
  if (inicio === atual) return 'Esta semana'
  if (inicio === atual - 7 * DIA) return 'Semana passada'
  if (!inicio) return 'Sem data'
  return `Semana de ${formatarData(new Date(inicio).toISOString().slice(0, 10))}`
}

function agruparPorSemana(lista: NewsItem[]) {
  const grupos: Array<{ inicio: number; itens: NewsItem[] }> = []
  for (const item of lista) {
    const inicio = inicioDaSemana(item.date)
    const grupo = grupos.find((atual) => atual.inicio === inicio)
    if (grupo) grupo.itens.push(item)
    else grupos.push({ inicio, itens: [item] })
  }
  return grupos
}

// No computador o card do globo fica na lateral, alinhado à newsletter; no celular, logo abaixo do globo.
function useTelaLarga() {
  const consulta = '(min-width: 901px)'
  const [larga, setLarga] = useState(() => window.matchMedia(consulta).matches)
  useEffect(() => {
    const lista = window.matchMedia(consulta)
    const aoMudar = () => setLarga(lista.matches)
    lista.addEventListener('change', aoMudar)
    return () => lista.removeEventListener('change', aoMudar)
  }, [])
  return larga
}

export function Noticias() {
  const telaLarga = useTelaLarga()
  const [destinoCard, setDestinoCard] = useState<HTMLDivElement | null>(null)
  const news = useNoticias()
  const { hash } = useLocation()
  const [params, setParams] = useSearchParams()
  const ativa = categories.some((category) => category.slug === params.get('categoria')) ? params.get('categoria')! : ''
  const filtradas = useMemo(() => (ativa ? news.filter((item) => item.categorySlug === ativa) : news), [news, ativa])
  const [destaque, ...demais] = filtradas
  const grupos = useMemo(() => agruparPorSemana(demais), [demais])
  const contagem = (slug: string) => news.filter((item) => item.categorySlug === slug).length
  const fontes = new Set(news.map((item) => item.source)).size

  // Links da Home (#slug) chegam antes das notícias do banco; rola quando o item existir.
  useEffect(() => {
    if (!hash) return
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' })
  }, [hash, news])

  const filtrar = (slug: string, botao?: HTMLElement) => {
    setParams(slug ? { categoria: slug } : {}, { replace: true, preventScrollReset: true })
    // No celular a barra rola de lado; mantém o filtro escolhido visível.
    botao?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  return <><SEO title="Notícias" description="Curadoria semanal do time do CITi: o que está movendo o mercado e por que isso importa para a sua empresa." />
    <section className="page-banner page-banner--ambient news-banner">
      <LuzAmbiente velocidade={0.8} />
      <div className="page-banner-fade" aria-hidden="true" />
      <div className="page-banner-content container news-hero">
        <div className="news-hero-copy">
        <span className="news-live"><span className="news-live-dot" aria-hidden="true" /><Radar size={14} aria-hidden="true" /> Radar da semana{news[0]?.date && <> · <span className="news-live-extra">atualizado em </span>{formatarData(news[0].date)}</>}</span>
        <h1>O que está <strong>movendo o mercado.</strong></h1>
        <p>Toda segunda, o time do CITi separa as notícias que importam para quem decide sobre tecnologia na empresa, e explica por quê.</p>
        <dl className="news-stats">
          <div><dt>Notícias</dt><dd>{news.length}</dd></div>
          <div><dt>Fontes</dt><dd>{fontes}</dd></div>
          <div><dt>Atualização</dt><dd>Semanal</dd></div>
        </dl>
        </div>
        <Suspense fallback={<div className="globo" aria-hidden="true" />}><GloboNoticias noticias={news} destinoCard={telaLarga ? destinoCard : null} /></Suspense>
      </div>
    </section>

    <section className="news-layout container">
      <div className="news-main">
        <div className="news-filters" role="group" aria-label="Filtrar por categoria">
          <button type="button" className={!ativa ? 'news-filter active' : 'news-filter'} aria-pressed={!ativa} onClick={(event) => filtrar('', event.currentTarget)}>Todas <b>{news.length}</b></button>
          {categories.map((category) => <button type="button" key={category.slug} className={ativa === category.slug ? 'news-filter active' : 'news-filter'} aria-pressed={ativa === category.slug} onClick={(event) => filtrar(category.slug, event.currentTarget)}>{category.label} <b>{contagem(category.slug)}</b></button>)}
        </div>
        <p className="sr-only" aria-live="polite">{filtradas.length} notícias</p>

        {!destaque && <div className="news-empty"><h2>Nenhuma notícia nesta categoria ainda.</h2><p>Volte na segunda ou veja todas as categorias.</p><button type="button" className="button-secondary" onClick={() => filtrar('')}>Ver todas</button></div>}
        {destaque && <NoticiaCard item={destaque} numero={1} destaque key={`destaque-${destaque.slug}`} />}

        {grupos.map((grupo, indiceGrupo) => {
          const antes = grupos.slice(0, indiceGrupo).reduce((total, atual) => total + atual.itens.length, 0)
          return <section className="news-week" key={grupo.inicio} aria-labelledby={`semana-${grupo.inicio}`}>
            <h2 className="news-week-title" id={`semana-${grupo.inicio}`}><span>{rotuloDaSemana(grupo.inicio)}</span><small>{grupo.itens.length} {grupo.itens.length === 1 ? 'notícia' : 'notícias'}</small></h2>
            <div className="news-timeline">
              {grupo.itens.map((item, index) => <NoticiaCard item={item} numero={antes + index + 2} ordem={index} key={`${ativa}-${item.slug}`} />)}
            </div>
          </section>
        })}
      </div>

      <aside className="news-aside">
        {telaLarga && <div className="news-globo-slot" ref={setDestinoCard} />}
        <NewsletterBlock compact />
      </aside>
    </section>
  </>
}
