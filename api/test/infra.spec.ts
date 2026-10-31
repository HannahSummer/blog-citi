import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { criarApp, limparBanco, leadValido, prisma } from './ajudas'

describe('infraestrutura da API', () => {
  let app: INestApplication
  beforeAll(async () => { app = await criarApp() })
  beforeEach(limparBanco)
  afterAll(async () => { await app.close(); await prisma.$disconnect() })

  it('GET /api/saude responde ok com o banco no ar', async () => {
    const r = await request(app.getHttpServer()).get('/api/saude')
    expect(r.status).toBe(200)
    expect(r.body).toEqual({ ok: true })
  })

  it('libera o site configurado no CORS e nenhuma outra origem', async () => {
    const permitida = await request(app.getHttpServer()).get('/api/saude').set('Origin', 'http://localhost:5173')
    expect(permitida.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    const bloqueada = await request(app.getHttpServer()).get('/api/saude').set('Origin', 'https://site-estranho.com')
    expect(bloqueada.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('documentação Swagger disponível quando SWAGGER_HABILITADO=true', async () => {
    const r = await request(app.getHttpServer()).get('/api/docs-json')
    expect(r.status).toBe(200)
    expect(r.body.paths).toHaveProperty('/api/diagnosticos')
  })

  it('o diagnóstico continua respondendo depois de vários envios (sem vazar estado)', async () => {
    for (let i = 0; i < 3; i++) {
      const r = await request(app.getHttpServer()).post('/api/diagnosticos').send(leadValido({ email: `pessoa${i}@empresa.com` }))
      expect(r.status).toBe(201)
    }
    expect(await prisma.diagnostico.count()).toBe(3)
  })
})
