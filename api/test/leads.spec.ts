import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { criarApp, criarEditora, leadValido, limparBanco, prisma } from './ajudas'

const UUID_INEXISTENTE = '00000000-0000-4000-8000-000000000000'

describe('painel de leads (/api/admin)', () => {
  let app: INestApplication
  let token: string

  beforeAll(async () => { app = await criarApp() })
  beforeEach(async () => {
    await limparBanco()
    await criarEditora()
    const login = await request(app.getHttpServer()).post('/api/auth/entrar').send({ email: 'editora@citi.org.br', senha: 'senha-de-teste-123456' })
    token = login.body.token
  })
  afterAll(async () => { await app.close(); await prisma.$disconnect() })

  const comToken = (metodo: 'get' | 'patch', caminho: string) => request(app.getHttpServer())[metodo](caminho).set('Authorization', `Bearer ${token}`)

  it('todas as rotas do painel exigem token', async () => {
    const chamadas = [
      () => request(app.getHttpServer()).get('/api/admin/diagnosticos'),
      () => request(app.getHttpServer()).get('/api/admin/newsletter'),
      () => request(app.getHttpServer()).patch(`/api/admin/diagnosticos/${UUID_INEXISTENTE}`).send({ status: 'novo' }),
    ]
    for (const chamada of chamadas) expect((await chamada()).status).toBe(401)
  })

  it('lista os leads recebidos, do mais recente para o mais antigo', async () => {
    await request(app.getHttpServer()).post('/api/diagnosticos').send(leadValido({ email: 'primeiro@empresa.com' }))
    await request(app.getHttpServer()).post('/api/diagnosticos').send(leadValido({ email: 'segundo@empresa.com' }))
    const r = await comToken('get', '/api/admin/diagnosticos')
    expect(r.status).toBe(200)
    expect(r.body).toHaveLength(2)
    expect(new Date(r.body[0].created_at).getTime()).toBeGreaterThanOrEqual(new Date(r.body[1].created_at).getTime())
  })

  it('muda o status de um lead', async () => {
    await request(app.getHttpServer()).post('/api/diagnosticos').send(leadValido())
    const lead = await prisma.diagnostico.findFirstOrThrow()
    const r = await comToken('patch', `/api/admin/diagnosticos/${lead.id}`).send({ status: 'em_contato' })
    expect(r.status).toBe(200)
    expect(r.body.status).toBe('em_contato')
  })

  it('recusa status fora da lista', async () => {
    await request(app.getHttpServer()).post('/api/diagnosticos').send(leadValido())
    const lead = await prisma.diagnostico.findFirstOrThrow()
    const r = await comToken('patch', `/api/admin/diagnosticos/${lead.id}`).send({ status: 'ganho' })
    expect(r.status).toBe(400)
  })

  it('id inválido responde 400 e lead inexistente responde 404', async () => {
    expect((await comToken('patch', '/api/admin/diagnosticos/abc').send({ status: 'novo' })).status).toBe(400)
    expect((await comToken('patch', `/api/admin/diagnosticos/${UUID_INEXISTENTE}`).send({ status: 'novo' })).status).toBe(404)
  })

  it('lista só as inscrições ativas da newsletter', async () => {
    await prisma.newsletterInscricao.create({ data: { email: 'ativa@empresa.com', consentimento_versao: 'v1' } })
    await prisma.newsletterInscricao.create({ data: { email: 'inativa@empresa.com', consentimento_versao: 'v1', ativo: false } })
    const r = await comToken('get', '/api/admin/newsletter')
    expect(r.body.map((item: { email: string }) => item.email)).toEqual(['ativa@empresa.com'])
  })
})
