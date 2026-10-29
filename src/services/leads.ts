import type { UtmParams } from '../hooks/useUtm'
import { supabase } from '../lib/supabase'
import { calcularResultado, diagnosticoPerguntas, type Respostas } from '../config/diagnostico'
import { respostasValidas, somenteDigitos, validarCampos, type DiagnosticoCampos } from '../lib/diagnostico-schema'

// Mude o número quando o texto de consentimento mudar.
export const CONSENTIMENTO_VERSAO = 'diagnostico-v1-2026-10'

export interface DiagnosticoInput extends DiagnosticoCampos {
  respostas: Respostas
  origem?: string
  pagina_referencia?: string
  utm?: UtmParams
}

export type ResultadoEnvio = { ok: true } | { ok: false; erro: string }

const ERRO_ENVIO = 'Não conseguimos enviar agora. Tente de novo em instantes.'
const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const clean = (value: string | undefined) => value?.trim() ?? ''
// Origem, referência e UTMs vêm da URL: corta no limite do banco para o insert não falhar.
const curto = (value: string | undefined, max = 200) => clean(value).slice(0, max) || null

function normalizar(dados: DiagnosticoInput) {
  // Grava só os ids conhecidos; pontuação e nível são sempre recalculados aqui.
  const respostas = Object.fromEntries(diagnosticoPerguntas.map((pergunta) => [pergunta.id, dados.respostas[pergunta.id]]))
  const { pontuacao, nivel } = calcularResultado(dados.respostas)
  return {
    nome: clean(dados.nome),
    email: clean(dados.email).toLowerCase(),
    empresa: clean(dados.empresa),
    cargo: clean(dados.cargo),
    telefone: somenteDigitos(clean(dados.telefone)) || null,
    como_conheceu: clean(dados.como_conheceu),
    problema: clean(dados.problema) || null,
    respostas,
    pontuacao,
    nivel,
    consentimento_contato: dados.consentimento_contato,
    newsletter_optin: dados.newsletter_optin,
    consentimento_versao: CONSENTIMENTO_VERSAO,
    origem: curto(dados.origem),
    pagina_referencia: curto(dados.pagina_referencia, 500),
    utm_source: curto(dados.utm?.utm_source),
    utm_medium: curto(dados.utm?.utm_medium),
    utm_campaign: curto(dados.utm?.utm_campaign),
    utm_content: curto(dados.utm?.utm_content),
  }
}

export async function submitDiagnostico(dados: DiagnosticoInput): Promise<ResultadoEnvio> {
  // Mesma validação do formulário: nada é gravado sem consentimento ou com respostas incompletas.
  if (Object.keys(validarCampos(dados)).length > 0 || !respostasValidas(dados.respostas)) return { ok: false, erro: 'Revise os campos destacados.' }
  const payload = normalizar(dados)
  if (!supabase) {
    await wait(800)
    console.info('[modo demonstração] submitDiagnostico', payload)
    return { ok: true }
  }
  // Sem .select(): o papel anon não tem permissão de leitura.
  const { error } = await supabase.from('diagnosticos').insert(payload)
  if (error) {
    console.error('[Supabase] Falha ao inserir diagnóstico', error)
    return { ok: false, erro: ERRO_ENVIO }
  }
  return { ok: true }
}

export async function subscribeNewsletter(email: string, origem = 'site'): Promise<ResultadoEnvio> {
  const payload = { email: clean(email).toLowerCase(), origem: clean(origem) || 'site', consentimento_versao: CONSENTIMENTO_VERSAO }
  if (!supabase) {
    await wait(800)
    console.info('[modo demonstração] subscribeNewsletter', payload)
    return { ok: true }
  }
  const { error } = await supabase.from('newsletter_inscricoes').insert(payload)
  if (error?.code === '23505') return { ok: true }
  if (error) {
    console.error('[Supabase] Falha ao inscrever newsletter', error)
    return { ok: false, erro: ERRO_ENVIO }
  }
  return { ok: true }
}
