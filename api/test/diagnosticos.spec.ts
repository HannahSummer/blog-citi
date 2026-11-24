import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { criarApp, leadValido, limparBanco, prisma } from './ajudas'

describe('POST /api/diagnosticos', () => {
  let app: INestApplication
  beforeAll(async () => { app = await criarApp() })
  beforeEach(limparBanco)
  afterAll(async () => { await app.close(); await prisma.$disconnect() })

  const enviar = (corpo: unknown) => request(app.getHttpServer()).post('/api/diagnosticos').send(corpo as object)

  it('grava o lead e recalcula pontuação, nível e e-mail (o que vem do navegador não vale)', async () => {
    const r = await enviar({ ...leadValido(), pontuacao: 12, nivel: 'estruturado' })
    expect(r.status).toBe(201)
    const [lead] = await prisma.diagnostico.findMany()
    expect(lead.pontuacao).toBe(8) // 2+1+0+2+1+2
    expect(lead.nivel).toBe('evolucao')
    expect(lead.email).toBe('maria@empresa.com.br')
    expect(lead.telefone).toBe('81999990000')
    expect(lead.status).toBe('novo')
    expect(lead.problema).toBeNull()
  })

  it('grava só as perguntas conhecidas nas respostas', async () => {
    await enviar({ ...leadValido(), respostas: { ...leadValido().respostas, intruso: 2 } })
    const [lead] = await prisma.diagnostico.findMany()
    expect(lead.respostas).not.toHaveProperty('intruso')
    expect(Object.keys(lead.respostas as object)).toHaveLength(6)
  })

  it('grava o problema quando a pessoa escreve', async () => {
    await enviar(leadValido({ problema: 'Perco tempo refazendo planilhas toda semana.' }))
    const [lead] = await prisma.diagnostico.findMany()
    expect(lead.problema).toBe('Perco tempo refazendo planilhas toda semana.')
  })

  it('recusa sem consentimento de contato e não grava nada', async () => {
    const r = await enviar(leadValido({ consentimento_contato: false }))
    expect(r.status).toBe(400)
    expect(r.body.campos).toHaveProperty('consentimento_contato')
    expect(await prisma.diagnostico.count()).toBe(0)
  })

  it('recusa respostas incompletas', async () => {
    const r = await enviar(leadValido({ respostas: { processos: 2 } }))
    expect(r.status).toBe(400)
    expect(await prisma.diagnostico.count()).toBe(0)
  })

  it('recusa resposta fora de 0 a 2', async () => {
    const r = await enviar(leadValido({ respostas: { ...leadValido().respostas, processos: 5 } }))
    expect(r.status).toBe(400)
  })

  it('recusa telefone com tamanho errado, apontando o campo', async () => {
    const r = await enviar(leadValido({ telefone: '99999' }))
    expect(r.status).toBe(400)
    expect(r.body.campos).toHaveProperty('telefone')
  })

  it('recusa e-mail inválido e como_conheceu fora da lista', async () => {
    const r = await enviar(leadValido({ email: 'sem-arroba', como_conheceu: 'tiktok' }))
    expect(r.status).toBe(400)
    expect(r.body.campos).toHaveProperty('email')
    expect(r.body.campos).toHaveProperty('como_conheceu')
  })

  it('recusa envio sem a versão do consentimento', async () => {
    const { consentimento_versao: _versao, ...semVersao } = leadValido()
    const r = await enviar(semVersao)
    expect(r.status).toBe(400)
    expect(r.body.erro).toMatch(/consentimento/)
  })

  it('recusa corpo que não é um objeto', async () => {
    const r = await request(app.getHttpServer()).post('/api/diagnosticos').set('Content-Type', 'application/json').send('[1,2]')
    expect(r.status).toBe(400)
  })

  it('corta origem, referência e UTMs no limite do banco', async () => {
    await enviar(leadValido({ origem: 'x'.repeat(300), pagina_referencia: 'y'.repeat(600), utm: { utm_source: 'z'.repeat(250) } }))
    const [lead] = await prisma.diagnostico.findMany()
    expect(lead.origem).toHaveLength(200)
    expect(lead.pagina_referencia).toHaveLength(500)
    expect(lead.utm_source).toHaveLength(200)
  })

  it('com "quero a newsletter", entra na lista de inscritos (origem diagnóstico)', async () => {
    await enviar(leadValido({ newsletter_optin: true }))
    const inscritos = await prisma.newsletterInscricao.findMany()
    expect(inscritos).toHaveLength(1)
    expect(inscritos[0].email).toBe('maria@empresa.com.br')
    expect(inscritos[0].origem).toBe('diagnostico')
  })

  it('não duplica quem já está na newsletter', async () => {
    await prisma.newsletterInscricao.create({ data: { email: 'maria@empresa.com.br', consentimento_versao: 'v0' } })
    const r = await enviar(leadValido({ newsletter_optin: true }))
    expect(r.status).toBe(201)
    expect(await prisma.newsletterInscricao.count()).toBe(1)
  })
})
