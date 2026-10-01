import type { UtmParams } from '../hooks/useUtm'
import { supabase } from '../lib/supabase'

export const CONSENTIMENTO_VERSAO = 'diagnostico-v1-2026-10'

export interface DiagnosticoInput {
  nome: string
  email: string
  empresa: string
  cargo: string
  telefone: string
  como_conheceu: string
  problema: string
  consentimento_contato: boolean
  newsletter_optin: boolean
  origem?: string
  pagina_referencia?: string
  utm?: UtmParams
}

export type ResultadoEnvio = { ok: true } | { ok: false; erro: string }

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const clean = (value: string | undefined) => value?.trim() ?? ''

function normalizar(dados: DiagnosticoInput) {
  return {
    nome: clean(dados.nome),
    email: clean(dados.email).toLowerCase(),
    empresa: clean(dados.empresa),
    cargo: clean(dados.cargo),
    telefone: clean(dados.telefone).replace(/\D/g, '') || null,
    como_conheceu: clean(dados.como_conheceu),
    problema: clean(dados.problema),
    consentimento_contato: dados.consentimento_contato,
    newsletter_optin: dados.newsletter_optin,
    consentimento_versao: CONSENTIMENTO_VERSAO,
    origem: clean(dados.origem) || null,
    pagina_referencia: clean(dados.pagina_referencia) || null,
    utm_source: clean(dados.utm?.utm_source) || null,
    utm_medium: clean(dados.utm?.utm_medium) || null,
    utm_campaign: clean(dados.utm?.utm_campaign) || null,
    utm_content: clean(dados.utm?.utm_content) || null,
  }
}

export async function submitDiagnostico(dados: DiagnosticoInput): Promise<ResultadoEnvio> {
  const payload = normalizar(dados)
  if (!supabase) {
    await wait(800)
    console.info('[modo demonstração] submitDiagnostico', payload)
    return { ok: true }
  }
  const { error } = await supabase.from('diagnosticos').insert(payload)
  if (error) {
    console.error('[Supabase] Falha ao inserir diagnóstico', error)
    return { ok: false, erro: 'Não conseguimos enviar agora. Tente de novo em instantes.' }
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
    return { ok: false, erro: 'Não conseguimos enviar agora. Tente de novo em instantes.' }
  }
  return { ok: true }
}