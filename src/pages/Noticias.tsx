import { news } from '../data/noticias'
import { CategoryPills } from '../components/CategoryPills'
import { NewsletterBlock } from '../components/NewsletterBlock'
import { SEO } from '../components/SEO'
import { formatarData } from '../lib/datas'

export function Noticias() {
  return <><SEO title="Notícias" description="Curadoria semanal do time do CITi." /><section className="page-banner container"><span className="eyebrow">Notícias</span><h1>O que está <strong>movendo o mercado.</strong></h1><p>Curadoria semanal do time do CITi</p><CategoryPills /></section><section className="news-page container"><div className="news-list"><span className="eyebrow">Radar semanal</span>{news.map((item) => <article className="news-item" id={item.slug} key={item.slug}><div className="post-meta">{formatarData(item.date)} <i>•</i> {item.category}</div><h2>{item.title}</h2><p>{item.summary}</p><blockquote><strong>Por que importa</strong>{item.content}</blockquote><a className="text-link" href={item.link} target="_blank" rel="noopener noreferrer">Ler na fonte ↗</a></article>)}</div><aside><NewsletterBlock compact /></aside></section></>
}
