import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { calcularResultado, diagnosticoPerguntas } from '../config/diagnostico'

const respostas = Object.fromEntries(diagnosticoPerguntas.map((pergunta) => [pergunta.id, 2]))
const lead = {
  nome: 'Ana Souza',
  email: 'ana@empresa.com.br',
  empresa: 'Empresa X',
  cargo: 'Diretora',
  telefone: '(81) 99999-0000',
  como_conheceu: 'linkedin',
  problema: '',
  consentimento_contato: true,
  newsletter_optin: false,
  respostas,
}

// O módulo lê VITE_API_URL na carga; estes testes forçam o modo demonstração (sem API).
async function carregarSemApi() {
  vi.resetModules()
  vi.stubEnv('VITE_API_URL', '')
  return import('./leads')
}

describe('envio do diagnóstico (modo demonstração, sem API)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('aceita um formulário válido', async () => {
    const { submitDiagnostico } = await carregarSemApi()
    expect(await submitDiagnostico(lead)).toEqual({ ok: true })
  })

  it('recusa sem consentimento antes de qualquer envio', async () => {
    const { submitDiagnostico } = await carregarSemApi()
    const r = await submitDiagnostico({ ...lead, consentimento_contato: false })
    expect(r.ok).toBe(false)
  })

  it('recusa respostas incompletas', async () => {
    const { submitDiagnostico } = await carregarSemApi()
    const r = await submitDiagnostico({ ...lead, respostas: { processos: 2 } })
    expect(r.ok).toBe(false)
  })

  it('inscreve na newsletter em modo demonstração', async () => {
    const { subscribeNewsletter } = await carregarSemApi()
    expect(await subscribeNewsletter('ana@empresa.com.br')).toEqual({ ok: true })
  })
})

describe('contrato entre o site e a API', () => {
  it('a versão do consentimento está no formato que a API espera', async () => {
    const { CONSENTIMENTO_VERSAO } = await carregarSemApi()
    expect(CONSENTIMENTO_VERSAO.length).toBeGreaterThan(0)
    expect(CONSENTIMENTO_VERSAO.length).toBeLessThanOrEqual(60)
  })

  it('o resultado do quiz é calculado pelo mesmo código que a API usa', () => {
    expect(calcularResultado(respostas).pontuacao).toBe(diagnosticoPerguntas.length * 2)
  })
})
