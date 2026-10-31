import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { criarApp, criarEditora, limparBanco, prisma } from './ajudas'

// O GitHub é simulado: nenhum teste faz commit de verdade.
const artigoValido = {
  titulo: 'Como medir o retorno de um projeto de software',
  resumo: 'Um guia curto para saber se o investimento em tecnologia está dando resultado.',
  metaDescription: 'Aprenda a medir o retorno de um projeto de software com indicadores simples, antes e depois da entrega, e decida com dados se vale continuar investindo.',
  data: '2026-11-02',
  categoria: 'gestao',
  subtema: 'financas',
  etapaFunil: 'awareness',
  ctaTipo: 'diagnostico',
  autor: 'Equipe CITi',
  palavrasChave: 'retorno de software, ROI',
  corpo: '## Por que medir\n\nTexto do artigo com um [link](https://citi.org.br).',
  rascunho: false,
}

describe('artigos pelo painel (/api/admin/artigos)', () => {
  let app: INestApplication
  let token: string
  let chamadas: Array<{ url: string; metodo: string; corpo?: { message: string; content: string; branch: string } }>
  const fetchOriginal = global.fetch
  const ambienteOriginal = { ...process.env }

  // Simula o GitHub: o arquivo não existe (404) e o commit é aceito (201).
  function simularGithub({ existe = false, aceita = true } = {}) {
    chamadas = []
    global.fetch = jest.fn(async (url: string | URL | Request, opcoes?: RequestInit) => {
      const metodo = opcoes?.method ?? 'GET'
      chamadas.push({ url: String(url), metodo, corpo: opcoes?.body ? JSON.parse(String(opcoes.body)) : undefined })
      if (metodo === 'GET') return new Response('{}', { status: existe ? 200 : 404 })
      return new Response(JSON.stringify({ commit: { html_url: 'https://github.com/HannahSummer/blog-citi/commit/abc' } }), { status: aceita ? 201 : 403 })
    }) as typeof fetch
  }

  beforeAll(async () => { app = await criarApp() })
  beforeEach(async () => {
    process.env.GITHUB_TOKEN = 'token-de-teste'
    process.env.GITHUB_REPO = 'HannahSummer/blog-citi'
    process.env.GITHUB_BRANCH = 'deploy-coolify'
    await limparBanco()
    await criarEditora()
    token = (await request(app.getHttpServer()).post('/api/auth/entrar').send({ email: 'editora@citi.org.br', senha: 'senha-de-teste-123456' })).body.token
    simularGithub()
  })
  afterEach(() => { global.fetch = fetchOriginal; process.env = { ...ambienteOriginal } })
  afterAll(async () => { await app.close(); await prisma.$disconnect() })

  const publicar = (corpo: object) => request(app.getHttpServer()).post('/api/admin/artigos').set('Authorization', `Bearer ${token}`).send(corpo)

  it('exige login de editora', async () => {
    expect((await request(app.getHttpServer()).post('/api/admin/artigos').send(artigoValido)).status).toBe(401)
  })

  it('faz o commit do arquivo .md na branch configurada, no formato dos artigos existentes', async () => {
    const r = await publicar(artigoValido)
    expect(r.status).toBe(201)
    expect(r.body.slug).toBe('como-medir-o-retorno-de-um-projeto-de-software')
    expect(r.body.branch).toBe('deploy-coolify')
    const commit = chamadas.find((c) => c.metodo === 'PUT')!
    expect(commit.url).toBe('https://api.github.com/repos/HannahSummer/blog-citi/contents/src/content/posts/como-medir-o-retorno-de-um-projeto-de-software.md')
    expect(commit.corpo!.branch).toBe('deploy-coolify')
    const arquivo = Buffer.from(commit.corpo!.content, 'base64').toString('utf8')
    expect(arquivo).toContain('title: "Como medir o retorno de um projeto de software"')
    expect(arquivo).toContain('subtema: "financas"')
    expect(arquivo).toContain('draft: false')
    expect(arquivo).toContain('featured: false')
    expect(arquivo).toContain('## Por que medir')
  })

  it('rascunho vai com draft: true (não aparece no site)', async () => {
    await publicar({ ...artigoValido, rascunho: true })
    const arquivo = Buffer.from(chamadas.find((c) => c.metodo === 'PUT')!.corpo!.content, 'base64').toString('utf8')
    expect(arquivo).toContain('draft: true')
  })

  it('recusa com as mesmas regras do build e não chama o GitHub', async () => {
    const r = await publicar({ ...artigoValido, titulo: 'x'.repeat(70), metaDescription: 'curta', subtema: 'vendas', corpo: '# Título errado' })
    expect(r.status).toBe(400)
    expect(Object.keys(r.body.campos).sort()).toEqual(['corpo', 'metaDescription', 'subtema', 'titulo'])
    expect(chamadas).toHaveLength(0)
  })

  it('não sobrescreve um artigo que já existe', async () => {
    simularGithub({ existe: true })
    const r = await publicar(artigoValido)
    expect(r.status).toBe(409)
    expect(chamadas.some((c) => c.metodo === 'PUT')).toBe(false)
  })

  it('avisa quando o GitHub recusa o commit', async () => {
    simularGithub({ aceita: false })
    const r = await publicar(artigoValido)
    expect(r.status).toBe(502)
    expect(r.body.erro).toMatch(/permissão/)
  })

  it('sem token configurado, responde 503 e a configuração diz que falta', async () => {
    delete process.env.GITHUB_TOKEN
    expect((await publicar(artigoValido)).status).toBe(503)
    const config = await request(app.getHttpServer()).get('/api/admin/artigos/configuracao').set('Authorization', `Bearer ${token}`)
    expect(config.body).toEqual({ configurado: false, repositorio: null, branch: 'deploy-coolify' })
  })
})
