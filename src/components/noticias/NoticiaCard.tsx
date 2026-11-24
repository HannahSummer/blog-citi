import type { CSSProperties } from 'react'
import { ArrowUpRight, Lightbulb } from 'lucide-react'
import type { NewsItem } from '../../data/noticias'
import { formatarData } from '../../lib/datas'

// Nome da fonte para o leitor. Buscas do Google Notícias mostram o domínio do link.
export function nomeDaFonte(item: Pick<NewsItem, 'source' | 'link'>): string {
  if (item.source && !item.source.startsWith('Google Notícias')) return item.source
  try { return new URL(item.link).hostname.replace(/^www\./, '') } catch { return item.source }
}

interface NoticiaCardProps {
  item: NewsItem
  numero?: number
  destaque?: boolean
  // Ordem na lista, para escalonar a animação de entrada.
  ordem?: number
  // Na prévia do painel não há link nem âncora.
  previa?: boolean
}

// Usado na página de notícias e na prévia do painel de curadoria, para os dois ficarem iguais.
export function NoticiaCard({ item, numero, destaque = false, ordem = 0, previa = false }: NoticiaCardProps) {
  const fonte = nomeDaFonte(item)
  // Sem número (prévia do painel), o card ocupa a largura toda em vez de reservar a coluna do número.
  const classe = ['news-card', destaque && 'news-card--lead', numero === undefined && 'news-card--sem-numero', `news-card--${item.categorySlug}`].filter(Boolean).join(' ')
  return <article className={classe} id={previa ? undefined : item.slug} style={{ '--ordem': ordem } as CSSProperties}>
    {numero !== undefined && <span className="news-card-number" aria-hidden="true">{String(numero).padStart(2, '0')}</span>}
    <div className="news-card-body">
      {destaque && <span className="news-card-flag">Destaque da semana</span>}
      <div className="news-card-meta">
        <span className="news-card-category">{item.category}</span>
        <time dateTime={item.date}>{formatarData(item.date)}</time>
        {fonte && <span className="news-card-source">{fonte}</span>}
      </div>
      <h2>{item.title}</h2>
      <p className="news-card-summary">{item.summary}</p>
      <div className="news-card-why">
        <span className="news-card-why-label"><Lightbulb size={15} aria-hidden="true" /> Por que importa</span>
        <p>{item.content}</p>
      </div>
      {previa
        ? <span className="news-card-link">Ler em {fonte} <ArrowUpRight size={15} /></span>
        : <a className="news-card-link" href={item.link} target="_blank" rel="noopener noreferrer">Ler em {fonte} <ArrowUpRight size={15} /><span className="sr-only"> (abre em nova aba)</span></a>}
    </div>
  </article>
}
