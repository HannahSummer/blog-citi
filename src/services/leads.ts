import type { UtmParams } from '../hooks/useUtm'
import { apiConfigurada, chamarApi } from '../lib/api'
import { lerToken } from './painel'
import type { Respostas } from '../config/diagnostico'
import { respostasValidas, validarCampos, type DiagnosticoCampos } from '../lib/diagnostico-schema'

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

export async function submitDiagnostico(dados: DiagnosticoInput): Promise<ResultadoEnvio> {
  // Mesma validação da API: nada é enviado sem consentimento ou com respostas incompletas.
  if (Object.keys(validarCampos(dados)).length > 0 || !respostasValidas(dados.respostas)) return { ok: false, erro: 'Revise os campos destacados.' }
  // A API recalcula pontuação e nível e normaliza os campos; aqui só vai o que a pessoa preencheu.
  const payload = { ...dados, consentimento_versao: CONSENTIMENTO_VERSAO }
  if (!apiConfigurada) {
    await wait(800)
    console.info('[modo demonstração] submitDiagnostico', payload)
    return { ok: true }
  }
  try {
    await chamarApi('/diagnosticos', { metodo: 'POST', corpo: payload })
    return { ok: true }
  } catch (erro) {
    console.error('[API] Falha ao enviar diagnóstico', erro)
    return { ok: false, erro: ERRO_ENVIO }
  }
}

export async function subscribeNewsletter(email: string, origem = 'site'): Promise<ResultadoEnvio> {
  const payload = { email: email.trim().toLowerCase(), origem: origem.trim() || 'site', consentimento_versao: CONSENTIMENTO_VERSAO }
  if (!apiConfigurada) {
    await wait(800)
    console.info('[modo demonstração] subscribeNewsletter', payload)
    return { ok: true }
  }
  try {
    await chamarApi('/newsletter', { metodo: 'POST', corpo: payload })
    return { ok: true }
  } catch (erro) {
    console.error('[API] Falha ao inscrever na newsletter', erro)
    return { ok: false, erro: ERRO_ENVIO }
  }
}

// Painel de leads (/blog/admin/leads). Só editoras logadas; a API confere o token.

export const statusLead = [
  { value: 'novo', label: 'Novo' },
  { value: 'em_contato', label: 'Em contato' },
  { value: 'qualificado', label: 'Qualificado' },
  { value: 'descartado', label: 'Descartado' },
] as const
export type StatusLead = (typeof statusLead)[number]['value']

export interface Lead {
  id: string
  created_at: string
  nome: string
  email: string
  empresa: string
  cargo: string
  telefone: string
  como_conheceu: string
  problema: string | null
  respostas: Record<string, number>
  pontuacao: number
  nivel: string
  newsletter_optin: boolean
  origem: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  status: StatusLead
}

export interface InscricaoNewsletter { email: string; origem: string | null; created_at: string }

export const listarLeads = () => chamarApi<Lead[]>('/admin/diagnosticos', { token: lerToken() })
export const atualizarStatusLead = (id: string, status: StatusLead) => chamarApi<Lead>(`/admin/diagnosticos/${id}`, { metodo: 'PATCH', corpo: { status }, token: lerToken() })
export const listarNewsletter = () => chamarApi<InscricaoNewsletter[]>('/admin/newsletter', { token: lerToken() })
