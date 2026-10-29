/**
 * Grava as sugestões da semana na tabela `noticias` como `pendente`.
 *
 * Usa SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do ambiente. A service_role
 * ignora o RLS, por isso só existe no GitHub Secrets e no .env local de quem
 * roda o radar. Nunca use VITE_ nem coloque essa chave no site.
 */
import { createClient } from '@supabase/supabase-js'

export interface SugestaoNoticia {
  semana: string
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
  motivo: string
  pontuacao: number
}

export function bancoConfigurado(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

/** Insere uma por uma para que um item inválido não derrube os outros. Links repetidos são ignorados. */
export async function enviarSugestoes(sugestoes: SugestaoNoticia[]): Promise<{ enviadas: number; repetidas: number; erros: string[] }> {
  const banco = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  let enviadas = 0
  let repetidas = 0
  const erros: string[] = []
  for (const sugestao of sugestoes) {
    const { error } = await banco.from('noticias').insert(sugestao)
    if (!error) enviadas++
    else if (error.code === '23505') repetidas++
    else erros.push(`${sugestao.titulo}: ${error.message}`)
  }
  return { enviadas, repetidas, erros }
}
