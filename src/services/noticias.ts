import { apiConfigurada, chamarApi } from '../lib/api'
import { lerToken } from './painel'
import { getCategory } from '../data/categorias'
import type { NewsItem } from '../data/noticias'
import type { StatusNoticia } from '../config/noticias'

export type { StatusNoticia }

export interface NoticiaPainel {
  id: string
  semana: string
  status: StatusNoticia
  titulo: string
  resumo: string
  por_que_importa: string
  categoria: string
  subtema: string | null
  continente: string | null
  fonte: string
  link: string
  data_fonte: string | null
  titulo_original: string
  trecho_feed: string | null
  motivo: string | null
  pontuacao: number | null
  revisado_em: string | null
  publicado_em: string | null
}

export type CamposEditaveis = Pick<NoticiaPainel, 'titulo' | 'resumo' | 'por_que_importa' | 'categoria' | 'subtema' | 'continente' | 'link'>

export function paraNewsItem(noticia: Pick<NoticiaPainel, 'id' | 'titulo' | 'resumo' | 'por_que_importa' | 'categoria' | 'continente' | 'fonte' | 'link' | 'data_fonte' | 'publicado_em'>): NewsItem {
  return {
    slug: `n-${noticia.id.slice(0, 8)}`,
    title: noticia.titulo,
    date: (noticia.publicado_em ?? noticia.data_fonte ?? '').slice(0, 10),
    category: getCategory(noticia.categoria)?.label ?? '',
    categorySlug: noticia.categoria,
    source: noticia.fonte,
    link: noticia.link,
    summary: noticia.resumo,
    content: noticia.por_que_importa,
    continente: noticia.continente ?? undefined,
  }
}

// Notícias aprovadas no painel (a API só devolve as colunas públicas).
export async function buscarNoticiasPublicadas(): Promise<NewsItem[]> {
  if (!apiConfigurada) return []
  try {
    return (await chamarApi<NoticiaPainel[]>('/noticias')).map(paraNewsItem)
  } catch (erro) {
    console.warn('[noticias] Não foi possível carregar as notícias aprovadas.', (erro as Error).message)
    return []
  }
}

// Painel de aprovação (só editoras). Login e token em services/painel.ts.

export async function listarNoticias(status: StatusNoticia): Promise<NoticiaPainel[]> {
  return chamarApi<NoticiaPainel[]>(`/admin/noticias?status=${status}`, { token: lerToken() })
}

export async function salvarNoticia(id: string, campos: Partial<CamposEditaveis> & { status?: StatusNoticia }): Promise<NoticiaPainel> {
  return chamarApi<NoticiaPainel>(`/admin/noticias/${id}`, { metodo: 'PATCH', corpo: campos, token: lerToken() })
}

// Notícia cadastrada à mão no painel: já entra publicada.
export interface NovaNoticia { titulo: string; resumo: string; por_que_importa: string; categoria: string; subtema: string | null; continente: string | null; fonte: string; link: string; data_fonte: string | null }

export async function cadastrarNoticia(noticia: NovaNoticia): Promise<NoticiaPainel> {
  return chamarApi<NoticiaPainel>('/admin/noticias', { metodo: 'POST', corpo: noticia, token: lerToken() })
}
