import { describe, expect, it } from 'vitest'
import { calcularResultado, diagnosticoPerguntas } from '../config/diagnostico'
import { emailPessoal, limites, ordemCampos, respostasValidas, somenteDigitos, validarCampos, type DiagnosticoCampos } from './diagnostico-schema'

const todasRespostas = Object.fromEntries(diagnosticoPerguntas.map((pergunta) => [pergunta.id, 1]))

const valido: DiagnosticoCampos = {
  nome: 'Ana Souza',
  email: 'ana@empresa.com.br',
  empresa: 'Empresa X',
  cargo: 'Diretora',
  telefone: '(81) 99999-0000',
  como_conheceu: 'linkedin',
  problema: 'x'.repeat(30),
  consentimento_contato: true,
  newsletter_optin: false,
}

describe('validação do formulário de diagnóstico', () => {
  it('aceita um formulário completo', () => {
    expect(validarCampos(valido)).toEqual({})
  })

  it('aceita telefone com máscara (a API recebe só os dígitos)', () => {
    expect(validarCampos({ ...valido, telefone: '(81) 9 9999-0000' })).toEqual({})
    expect(somenteDigitos('(81) 9 9999-0000')).toBe('81999990000')
  })

  it('o problema é opcional, mas tem limite de tamanho', () => {
    expect(validarCampos({ ...valido, problema: '' })).toEqual({})
    expect(validarCampos({ ...valido, problema: 'x'.repeat(limites.problema.max + 1) })).toHaveProperty('problema')
  })

  it('exige nome, empresa e cargo dentro do tamanho permitido', () => {
    expect(validarCampos({ ...valido, nome: 'A' })).toHaveProperty('nome')
    expect(validarCampos({ ...valido, empresa: '' })).toHaveProperty('empresa')
    expect(validarCampos({ ...valido, cargo: 'x'.repeat(limites.cargo.max + 1) })).toHaveProperty('cargo')
  })

  it('exige e-mail com formato válido', () => {
    expect(validarCampos({ ...valido, email: '' })).toHaveProperty('email')
    expect(validarCampos({ ...valido, email: 'ana@empresa' })).toHaveProperty('email')
    expect(validarCampos({ ...valido, email: 'ana empresa@x.com' })).toHaveProperty('email')
  })

  it('exige telefone com DDD e 8 ou 9 dígitos', () => {
    expect(validarCampos({ ...valido, telefone: '' })).toHaveProperty('telefone')
    expect(validarCampos({ ...valido, telefone: '8199' })).toHaveProperty('telefone')
  })

  it('exige uma opção válida em "como conheceu"', () => {
    expect(validarCampos({ ...valido, como_conheceu: '' })).toHaveProperty('como_conheceu')
    expect(validarCampos({ ...valido, como_conheceu: 'tiktok' })).toHaveProperty('como_conheceu')
  })

  it('bloqueia sem o consentimento de contato', () => {
    expect(validarCampos({ ...valido, consentimento_contato: false })).toHaveProperty('consentimento_contato')
  })

  it('a newsletter é opcional', () => {
    expect(validarCampos({ ...valido, newsletter_optin: false })).toEqual({})
    expect(validarCampos({ ...valido, newsletter_optin: true })).toEqual({})
  })

  it('a ordem dos campos segue a tela, para o foco ir ao primeiro erro', () => {
    expect(ordemCampos[0]).toBe('nome')
    expect(ordemCampos).toHaveLength(9)
  })
})

describe('respostas do quiz', () => {
  it('aceita respostas completas com 0, 1 ou 2', () => {
    expect(respostasValidas(todasRespostas)).toBe(true)
  })

  it('recusa quando falta uma pergunta ou o valor é inválido', () => {
    const { processos: _processos, ...incompleta } = todasRespostas
    expect(respostasValidas(incompleta)).toBe(false)
    expect(respostasValidas({ ...todasRespostas, processos: 3 })).toBe(false)
  })

  it('a pontuação do quiz completo com todas as respostas em 1 é 6', () => {
    expect(calcularResultado(todasRespostas).pontuacao).toBe(6)
  })
})

describe('e-mail pessoal', () => {
  it('reconhece provedores pessoais (com e sem subdomínio de país)', () => {
    expect(emailPessoal('ana@gmail.com')).toBe(true)
    expect(emailPessoal('ana@bol.com.br')).toBe(true)
    expect(emailPessoal('ana@yahoo.com.br')).toBe(true)
  })

  it('não marca domínio corporativo', () => {
    expect(emailPessoal('ana@empresa.com.br')).toBe(false)
    expect(emailPessoal('ana@globo.com')).toBe(false)
  })
})
