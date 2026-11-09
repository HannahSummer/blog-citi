import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { criarApp, limparBanco, prisma } from './ajudas'

describe('POST /api/newsletter', () => {
  let app: INestApplication
  beforeAll(async () => { app = await criarApp() })
  beforeEach(limparBanco)
  afterAll(async () => { await app.close(); await prisma.$disconnect() })

  const inscrever = (corpo: object) => request(app.getHttpServer()).post('/api/newsletter').send(corpo)

  it('inscreve o e-mail em minúsculas, com origem padrão "site"', async () => {
    const r = await inscrever({ email: '  Ana@Empresa.com.br ', consentimento_versao: 'diagnostico-v1-2026-10' })
    expect(r.status).toBe(201)
    const [inscrito] = await prisma.newsletterInscricao.findMany()
    expect(inscrito.email).toBe('ana@empresa.com.br')
    expect(inscrito.origem).toBe('site')
    expect(inscrito.ativo).toBe(true)
  })

  it('responde ok para e-mail já inscrito, sem duplicar', async () => {
    await inscrever({ email: 'ana@empresa.com.br', consentimento_versao: 'v1' })
    const r = await inscrever({ email: 'ANA@empresa.com.br', consentimento_versao: 'v1' })
    expect(r.status).toBe(201)
    expect(await prisma.newsletterInscricao.count()).toBe(1)
  })

  it('recusa e-mail inválido', async () => {
    const r = await inscrever({ email: 'nao-e-email', consentimento_versao: 'v1' })
    expect(r.status).toBe(400)
    expect(await prisma.newsletterInscricao.count()).toBe(0)
  })

  it('recusa sem versão do consentimento', async () => {
    const r = await inscrever({ email: 'ana@empresa.com.br' })
    expect(r.status).toBe(400)
  })
})
