import { Test } from '@nestjs/testing'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { PrismaClient } from '@prisma/client'
import { AppModule } from '../src/app.module'
import { configurarApp } from '../src/app.setup'
import { gerarHash } from '../src/auth/senha'

export const prisma = new PrismaClient()

// Sobe o app igual ao de produção (mesma configuração do main.ts). O limite de envios fica
// desligado por LIMITE_ENVIOS=false (ver setup-env.ts); o arquivo limite.spec.ts liga de novo.
export async function criarApp(): Promise<NestExpressApplication> {
  const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const app = modulo.createNestApplication<NestExpressApplication>()
  configurarApp(app)
  await app.init()
  return app
}

// Esvazia as tabelas entre os testes.
export async function limparBanco() {
  await prisma.$executeRawUnsafe('TRUNCATE diagnosticos, newsletter_inscricoes, noticias, editoras, visitas RESTART IDENTITY CASCADE')
}

export async function criarEditora(email = 'editora@citi.org.br', senha = 'senha-de-teste-123456', ativo = true) {
  return prisma.editora.create({ data: { email, senha_hash: await gerarHash(senha), ativo } })
}

// Respostas válidas do diagnóstico (6 perguntas, 0 a 2 pontos cada).
export const respostasValidas = { processos: 2, retrabalho: 1, conhecimento: 0, integracao: 2, medicao: 1, decisao: 2 }

// Lead que passa em todas as regras (consentimento marcado, telefone com DDD, problema opcional vazio).
export function leadValido(extra: Record<string, unknown> = {}) {
  return {
    nome: 'Maria Teste',
    email: 'Maria@Empresa.com.br',
    empresa: 'Empresa X',
    cargo: 'Diretora',
    telefone: '(81) 99999-0000',
    como_conheceu: 'blog',
    problema: '',
    consentimento_contato: true,
    newsletter_optin: false,
    respostas: respostasValidas,
    consentimento_versao: 'diagnostico-v1-2026-10',
    ...extra,
  }
}

// Sugestão de notícia no formato que o radar envia.
export function sugestaoValida(extra: Record<string, unknown> = {}) {
  return {
    semana: '2026-10-26',
    titulo: 'Título de teste com tamanho suficiente',
    resumo: 'Resumo de teste com mais de quarenta caracteres para passar na validação.',
    por_que_importa: 'Importa porque este texto de teste também tem mais de quarenta caracteres.',
    categoria: 'solucoes',
    subtema: 'dados',
    continente: 'europa',
    fonte: 'Fonte Teste',
    link: `https://exemplo.com/noticia-${Math.random().toString(36).slice(2)}`,
    data_fonte: '2026-10-25',
    titulo_original: 'Título original',
    trecho_feed: 'trecho',
    motivo: 'motivo de teste',
    pontuacao: 9,
    ...extra,
  }
}
