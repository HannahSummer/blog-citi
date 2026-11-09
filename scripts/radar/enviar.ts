/**
 * Envia as sugestões da semana para a API do blog, que as grava como `pendente`
 * para revisão no painel /blog/admin/noticias.
 *
 * Usa API_URL (endereço da API, sem /api) e RADAR_TOKEN do ambiente. O token só
 * existe no GitHub Secrets, no Coolify (serviço da API) e no .env local de quem roda o radar.
 * Nunca use VITE_ nem coloque esse token no site.
 */

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

export function apiConfigurada(): boolean {
  return Boolean(process.env.API_URL && process.env.RADAR_TOKEN)
}

/** A API grava uma por uma: um item inválido não derruba os outros e links repetidos são ignorados. */
export async function enviarSugestoes(sugestoes: SugestaoNoticia[]): Promise<{ enviadas: number; repetidas: number; erros: string[] }> {
  const resposta = await fetch(`${process.env.API_URL!.replace(/\/$/, '')}/api/radar/noticias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RADAR_TOKEN}` },
    body: JSON.stringify({ sugestoes }),
  })
  const dados = await resposta.json().catch(() => null)
  if (!resposta.ok) return { enviadas: 0, repetidas: 0, erros: [`API respondeu ${resposta.status}: ${dados?.erro ?? 'sem detalhes'}`] }
  return dados
}
