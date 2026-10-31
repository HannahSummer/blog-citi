import { lazy, Suspense, useEffect, useMemo } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Radar, X } from 'lucide-react'
import { useNoticias } from '../hooks/useNoticias'
import { useBarraFixa } from '../hooks/useBarraFixa'
import { NewsletterBlock } from '../components/newsletter/NewsletterBlock'
import { NoticiaCard, nomeDaFonte } from '../components/noticias/NoticiaCard'
import { SEO } from '../components/layout/SEO'
import LuzAmbiente from '../components/efeitos/LuzAmbiente'
import { categories } from '../data/categorias'
import { continentes } from '../data/continentes'
import type { NewsItem } from '../data/noticias'
import { formatarData } from '../lib/datas'

// O globo (d3 + mapa) só carrega nesta página.
const GloboNoticias = lazy(() => import('../components/noticias/GloboNoticias'))

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

// Lista das notícias do continente escolhido, logo abaixo do globo. Cada item leva ao card na linha do tempo.
function PainelDoContinente({ nome, itens, aoFechar, localAtual }: { nome: string; itens: NewsItem[]; aoFechar: () => void; localAtual: { pathname: string; search: string } }) {
  return <div className="globo-painel" aria-live="polite">
    <div className="globo-painel-topo">
      <h2>{nome} <small>{itens.length === 1 ? '1 notícia' : `${itens.length} notícias`}</small></h2>
      <button type="button" className="globo-icone" aria-label="Fechar e ver notícias de todos os continentes" onClick={aoFechar}><X size={16} /></button>
    </div>
    {itens.length === 0
      ? <p className="globo-dica">Nenhuma notícia desse continente com o filtro atual.</p>
      : <ul>{itens.map((item) => <li key={item.slug}>
        <Link to={{ pathname: localAtual.pathname, search: localAtual.search, hash: item.slug }}>{item.title}</Link>
        <small>{item.category} · {nomeDaFonte(item)}</small>
      </li>)}</ul>}
  </div>
}

export function Noticias() {
  const news = useNoticias()
  const localAtual = useLocation()
  const { refMarcador, refBarra, fixada } = useBarraFixa()
  const [params, setParams] = useSearchParams()
  const ativa = categories.some((category) => category.slug === params.get('categoria')) ? params.get('categoria')! : ''
  const continenteAtivo = continentes.find((continente) => continente.slug === params.get('continente'))
  const indiceContinente = continenteAtivo ? continentes.indexOf(continenteAtivo) : null
  // A lista, o painel do globo e a linha do tempo seguem o mesmo filtro. Pela tela só um fica ativo por vez
  // (categoria ou continente); um link com os dois na URL ainda funciona, combinando os dois.
  const filtradas = useMemo(
    () => news.filter((item) => (!ativa || item.categorySlug === ativa) && (!continenteAtivo || item.continente === continenteAtivo.slug)),
    [news, ativa, continenteAtivo],
  )
  const [destaque, ...demais] = filtradas
  const grupos = useMemo(() => agruparPorSemana(demais), [demais])
  const contagem = (slug: string) => news.filter((item) => item.categorySlug === slug).length
  const fontes = new Set(news.map((item) => item.source)).size

  // Links da Home e do painel (#slug) chegam antes das notícias do banco; rola quando o item existir.
  const { hash } = localAtual
  useEffect(() => {
    if (!hash) return
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' })
  }, [hash, news])

  // Mudar um filtro troca só o parâmetro da URL (categoria e continente), então o link fica compartilhável.
  const mudarFiltro = (mudanca: { categoria?: string; continente?: string | null }, botao?: HTMLElement) => {
    const proximo = new URLSearchParams(params)
    if (mudanca.categoria !== undefined) {
      if (mudanca.categoria) proximo.set('categoria', mudanca.categoria)
      else proximo.delete('categoria')
    }
    if (mudanca.continente !== undefined) {
      if (mudanca.continente) proximo.set('continente', mudanca.continente)
      else proximo.delete('continente')
    }
    setParams(proximo, { replace: true, preventScrollReset: true })
    // No celular a barra rola de lado; mantém o filtro escolhido visível.
    botao?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  // Duas faixas: à esquerda o título e a lista; à direita o globo, o painel do continente e a newsletter,
  // todos com a mesma largura. Abaixo de 1024 px vira uma coluna só (título, globo, lista, newsletter).
  return <><SEO title="Notícias" description="Curadoria semanal do time do CITi: o que está movendo o mercado e por que isso importa para a sua empresa." />
    <section className="news-pagina">
      <div className="news-ambiente" aria-hidden="true">
        <LuzAmbiente velocidade={0.8} />
        <div className="page-banner-fade" />
      </div>
      <div className="container news-grid">
        <div className="news-coluna">
          <header className="news-topo">
            <span className="news-live"><span className="news-live-dot" aria-hidden="true" /><Radar size={14} aria-hidden="true" /> Radar da semana{news[0]?.date && <> · <span className="news-live-extra">atualizado em </span>{formatarData(news[0].date)}</>}</span>
            <h1>O que está <strong>movendo o mercado.</strong></h1>
            <p>Toda segunda, o time do CITi separa as notícias que importam para quem decide sobre tecnologia na empresa, e explica por quê.</p>
            <dl className="news-stats">
              <div><dt>Notícias</dt><dd>{news.length}</dd></div>
              <div><dt>Fontes</dt><dd>{fontes}</dd></div>
              <div><dt>Atualização</dt><dd>Semanal</dd></div>
            </dl>
          </header>

          <div className="news-lista">
            {/* Categoria e continente são dois jeitos de navegar: escolher uma categoria desmarca o continente
                (e escolher um continente no globo desmarca a categoria), para a lista nunca ficar com um filtro escondido. */}
            <div ref={refMarcador} aria-hidden="true" />
            <div ref={refBarra} className={fixada ? 'news-filters fixada' : 'news-filters'} role="group" aria-label="Filtrar por categoria">
              <button type="button" className={!ativa && !continenteAtivo ? 'news-filter active' : 'news-filter'} aria-pressed={!ativa && !continenteAtivo} onClick={(event) => mudarFiltro({ categoria: '', continente: null }, event.currentTarget)}>Todas <b>{news.length}</b></button>
              {categories.map((category) => <button type="button" key={category.slug} className={ativa === category.slug ? 'news-filter active' : 'news-filter'} aria-pressed={ativa === category.slug} onClick={(event) => mudarFiltro({ categoria: category.slug, continente: null }, event.currentTarget)}>{category.label} <b>{contagem(category.slug)}</b></button>)}
            </div>
            {continenteAtivo && <div className="news-chip" role="status">
              <span>Mostrando as notícias de <b>{continenteAtivo.label}</b></span>
              <button type="button" onClick={() => mudarFiltro({ continente: null })}>Ver de todos os continentes</button>
            </div>}
            <p className="sr-only" aria-live="polite">{filtradas.length} notícias</p>

            {!destaque && <div className="news-empty"><h2>Nenhuma notícia com esses filtros.</h2><p>Tente outra categoria ou volte a ver tudo.</p><button type="button" className="button-secondary" onClick={() => setParams({}, { replace: true, preventScrollReset: true })}>Limpar filtros</button></div>}
            {destaque && <NoticiaCard item={destaque} numero={1} destaque key={`destaque-${destaque.slug}`} />}

            {grupos.map((grupo, indiceGrupo) => {
              const antes = grupos.slice(0, indiceGrupo).reduce((total, atual) => total + atual.itens.length, 0)
              return <section className="news-week" key={grupo.inicio} aria-labelledby={`semana-${grupo.inicio}`}>
                <h2 className="news-week-title" id={`semana-${grupo.inicio}`}><span>{rotuloDaSemana(grupo.inicio)}</span><small>{grupo.itens.length} {grupo.itens.length === 1 ? 'notícia' : 'notícias'}</small></h2>
                <div className="news-timeline">
                  {grupo.itens.map((item, index) => <NoticiaCard item={item} numero={antes + index + 2} ordem={index} key={`${ativa}-${continenteAtivo?.slug ?? ''}-${item.slug}`} />)}
                </div>
              </section>
            })}
          </div>
        </div>

        <div className="news-trilho">
          <div className="news-trilho-globo">
            <Suspense fallback={<div className="globo" aria-hidden="true" />}>
              <GloboNoticias noticias={news} selecionado={indiceContinente} onSelecionar={(indice) => mudarFiltro(indice === null ? { continente: null } : { continente: continentes[indice].slug, categoria: '' })} />
            </Suspense>
            {continenteAtivo && <PainelDoContinente nome={continenteAtivo.label} itens={filtradas} aoFechar={() => mudarFiltro({ continente: null })} localAtual={localAtual} />}
          </div>
          <div className="news-trilho-newsletter">
            <NewsletterBlock compact />
          </div>
        </div>
      </div>
    </section>
  </>
}
