import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { criarApp, leadValido, limparBanco, prisma } from './ajudas'

// Este arquivo liga o limite de envios de verdade (os outros desligam para não atrapalhar).
describe('limite de envios por IP', () => {
  let app: INestApplication
  const limiteOriginal = process.env.LIMITE_ENVIOS
  beforeAll(async () => {
    process.env.LIMITE_ENVIOS = 'true'
    app = await criarApp()
  })
  beforeEach(limparBanco)
  afterAll(async () => {
    process.env.LIMITE_ENVIOS = limiteOriginal
    await app.close()
    await prisma.$disconnect()
  })

  it('o diagnóstico aceita 5 envios por minuto e bloqueia o sexto', async () => {
    const ip = '203.0.113.10'
    const envios = []
    for (let i = 0; i < 6; i++) {
      envios.push(request(app.getHttpServer()).post('/api/diagnosticos').set('X-Forwarded-For', ip).send(leadValido({ email: `pessoa${i}@empresa.com` })))
    }
    const respostas = await Promise.all(envios)
    const codigos = respostas.map((r) => r.status).sort()
    expect(codigos.filter((c) => c === 201)).toHaveLength(5)
    expect(codigos.filter((c) => c === 429)).toHaveLength(1)
  })

  it('outro IP não herda o bloqueio', async () => {
    const r = await request(app.getHttpServer()).post('/api/diagnosticos').set('X-Forwarded-For', '198.51.100.7').send(leadValido())
    expect(r.status).toBe(201)
  })

  it('o login também tem limite (5 tentativas por minuto)', async () => {
    const ip = '192.0.2.50'
    const tentativas = await Promise.all(Array.from({ length: 6 }, () => request(app.getHttpServer()).post('/api/auth/entrar').set('X-Forwarded-For', ip).send({ email: 'x@y.com', senha: 'z' })))
    expect(tentativas.some((r) => r.status === 429)).toBe(true)
  })
})
