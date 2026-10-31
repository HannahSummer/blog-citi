// Regras do formulário de diagnóstico, usadas pelo site e pela API (api/). Espelham os CHECK
// da tabela `diagnosticos` (api/prisma/migrations). Se mudar uma regra aqui, mude também no banco.
import { comoConheceuOpcoes, diagnosticoPerguntas, type Respostas } from '../config/diagnostico'

export const limites = {
  nome: { min: 2, max: 120 },
  email: { max: 254 },
  empresa: { min: 2, max: 160 },
  cargo: { min: 2, max: 120 },
  telefone: { min: 10, max: 13 },
  problema: { max: 3000 },
} as const

export const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const DOMINIOS_PESSOAIS = ['gmail', 'hotmail', 'outlook', 'yahoo', 'icloud', 'bol', 'uol']

export interface DiagnosticoCampos {
  nome: string
  email: string
  empresa: string
  cargo: string
  telefone: string
  como_conheceu: string
  problema: string
  consentimento_contato: boolean
  newsletter_optin: boolean
}

export type CampoDiagnostico = keyof DiagnosticoCampos
export type ErrosDiagnostico = Partial<Record<CampoDiagnostico, string>>

// Ordem dos campos na tela, usada para levar o foco ao primeiro erro.
export const ordemCampos: CampoDiagnostico[] = ['nome', 'email', 'empresa', 'cargo', 'telefone', 'como_conheceu', 'problema', 'consentimento_contato', 'newsletter_optin']

export const somenteDigitos = (valor: string) => valor.replace(/\D/g, '')

export function emailPessoal(email: string) {
  const dominio = email.trim().toLowerCase().split('@')[1] ?? ''
  return DOMINIOS_PESSOAIS.some((nome) => dominio === nome || dominio.startsWith(`${nome}.`))
}

const tamanhoEntre = (valor: string, min: number, max: number) => valor.trim().length >= min && valor.trim().length <= max

export function validarCampos(dados: DiagnosticoCampos): ErrosDiagnostico {
  const erros: ErrosDiagnostico = {}
  if (!tamanhoEntre(dados.nome, limites.nome.min, limites.nome.max)) erros.nome = `Informe seu nome (${limites.nome.min} a ${limites.nome.max} caracteres).`
  const email = dados.email.trim()
  if (!email) erros.email = 'Informe seu e-mail.'
  else if (email.length > limites.email.max || !EMAIL_REGEX.test(email)) erros.email = 'Informe um e-mail válido, como nome@empresa.com.br.'
  if (!tamanhoEntre(dados.empresa, limites.empresa.min, limites.empresa.max)) erros.empresa = `Informe a empresa (${limites.empresa.min} a ${limites.empresa.max} caracteres).`
  if (!tamanhoEntre(dados.cargo, limites.cargo.min, limites.cargo.max)) erros.cargo = `Informe seu cargo (${limites.cargo.min} a ${limites.cargo.max} caracteres).`
  const telefone = somenteDigitos(dados.telefone)
  if (!telefone) erros.telefone = 'Informe um telefone ou WhatsApp com DDD.'
  else if (telefone.length < limites.telefone.min || telefone.length > limites.telefone.max) erros.telefone = 'Confira o número: use o DDD e 8 ou 9 dígitos.'
  if (!comoConheceuOpcoes.some((opcao) => opcao.value === dados.como_conheceu)) erros.como_conheceu = 'Escolha como conheceu o CITi.'
  // Opcional: só limita o tamanho quando preenchido.
  if (dados.problema.trim().length > limites.problema.max) erros.problema = `Use no máximo ${limites.problema.max} caracteres.`
  if (!dados.consentimento_contato) erros.consentimento_contato = 'Autorize o contato para enviar.'
  return erros
}

// Todas as perguntas respondidas com 0, 1 ou 2.
export function respostasValidas(respostas: Respostas) {
  return diagnosticoPerguntas.every((pergunta) => [0, 1, 2].includes(respostas[pergunta.id] as number))
}
