import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { criarApp, criarEditora, limparBanco, prisma } from './ajudas'

describe('login do painel (/api/auth)', () => {
  let app: INestApplication
  beforeAll(async () => { app = await criarApp() })
  beforeEach(async () => { await limparBanco(); await criarEditora() })
  afterAll(async () => { await app.close(); await prisma.$disconnect() })

  const entrar = (email: string, senha: string) => request(app.getHttpServer()).post('/api/auth/entrar').send({ email, senha })

  it('entra com e-mail e senha corretos e devolve um token', async () => {
    const r = await entrar('editora@citi.org.br', 'senha-de-teste-123456')
    expect(r.status).toBe(200)
    expect(typeof r.body.token).toBe('string')
    expect(r.body.email).toBe('editora@citi.org.br')
  })

  it('aceita o e-mail com maiúsculas', async () => {
    const r = await entrar('EDITORA@citi.org.br', 'senha-de-teste-123456')
    expect(r.status).toBe(200)
  })

  it('recusa senha errada com a mensagem genérica', async () => {
    const r = await entrar('editora@citi.org.br', 'senha-errada-123456')
    expect(r.status).toBe(401)
    expect(r.body.erro).toBe('E-mail ou senha incorretos.')
  })

  it('recusa e-mail desconhecido com a MESMA mensagem (não revela quem tem conta)', async () => {
    const r = await entrar('ninguem@citi.org.br', 'senha-de-teste-123456')
    expect(r.status).toBe(401)
    expect(r.body.erro).toBe('E-mail ou senha incorretos.')
  })

  it('recusa conta desativada mesmo com a senha certa', async () => {
    await prisma.editora.update({ where: { email: 'editora@citi.org.br' }, data: { ativo: false } })
    const r = await entrar('editora@citi.org.br', 'senha-de-teste-123456')
    expect(r.status).toBe(401)
  })

  it('recusa corpo sem a senha', async () => {
    const r = await request(app.getHttpServer()).post('/api/auth/entrar').send({ email: 'editora@citi.org.br' })
    expect(r.status).toBe(400)
  })

  it('GET /api/auth/eu exige token', async () => {
    const r = await request(app.getHttpServer()).get('/api/auth/eu')
    expect(r.status).toBe(401)
  })

  it('GET /api/auth/eu aceita o token recebido no login', async () => {
    const login = await entrar('editora@citi.org.br', 'senha-de-teste-123456')
    const r = await request(app.getHttpServer()).get('/api/auth/eu').set('Authorization', `Bearer ${login.body.token}`)
    expect(r.status).toBe(200)
    expect(r.body.email).toBe('editora@citi.org.br')
  })

  it('recusa token adulterado e cabeçalho sem o tipo "Bearer"', async () => {
    const login = await entrar('editora@citi.org.br', 'senha-de-teste-123456')
    const adulterado = await request(app.getHttpServer()).get('/api/auth/eu').set('Authorization', `Bearer ${login.body.token}x`)
    expect(adulterado.status).toBe(401)
    const semTipo = await request(app.getHttpServer()).get('/api/auth/eu').set('Authorization', login.body.token)
    expect(semTipo.status).toBe(401)
  })

  it('derruba o acesso na hora quando a editora é desativada depois do login', async () => {
    const login = await entrar('editora@citi.org.br', 'senha-de-teste-123456')
    await prisma.editora.update({ where: { email: 'editora@citi.org.br' }, data: { ativo: false } })
    const r = await request(app.getHttpServer()).get('/api/auth/eu').set('Authorization', `Bearer ${login.body.token}`)
    expect(r.status).toBe(401)
  })
})
