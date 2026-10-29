import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { getCategory } from '../data/categorias'
import type { NewsItem } from '../data/noticias'

// Notícias aprovadas no painel. As colunas listadas são as únicas que o site (anon) pode ler.
const COLUNAS_PUBLICAS = 'id, titulo, resumo, por_que_importa, categoria, subtema, continente, fonte, link, data_fonte, publicado_em'

export type StatusNoticia = 'pendente' | 'aprovada' | 'rejeitada'

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

export async function buscarNoticiasPublicadas(): Promise<NewsItem[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('noticias').select(COLUNAS_PUBLICAS).eq('status', 'aprovada').order('publicado_em', { ascending: false }).limit(60)
  if (error) { console.warn('[noticias] Não foi possível carregar as notícias aprovadas.', error.message); return [] }
  return (data ?? []).map((linha) => paraNewsItem(linha as NoticiaPainel))
}

// Painel de aprovação (só editores; o banco recusa os demais).

export async function sessaoAtual(): Promise<Session | null> {
  if (!supabase) return null
  return (await supabase.auth.getSession()).data.session
}

export async function entrar(email: string, senha: string): Promise<string | null> {
  if (!supabase) return 'Supabase não configurado.'
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
  return error ? 'E-mail ou senha incorretos.' : null
}

export async function sair() { await supabase?.auth.signOut() }

export async function souEditor(): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase.rpc('eh_editor')
  return !error && data === true
}

export async function listarNoticias(status: StatusNoticia): Promise<NoticiaPainel[]> {
  if (!supabase) return []
  const ordem = status === 'pendente' ? 'pontuacao' : 'revisado_em'
  const { data, error } = await supabase.from('noticias').select('*').eq('status', status).order('semana', { ascending: false }).order(ordem, { ascending: false, nullsFirst: false }).limit(100)
  if (error) throw new Error(error.message)
  return (data ?? []) as NoticiaPainel[]
}

export async function salvarNoticia(id: string, campos: Partial<CamposEditaveis> & { status?: StatusNoticia }): Promise<NoticiaPainel> {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { data, error } = await supabase.from('noticias').update(campos).eq('id', id).select('*').single()
  if (error) throw new Error(error.message)
  return data as NoticiaPainel
}
