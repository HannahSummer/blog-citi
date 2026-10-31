import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { criarApp, criarEditora, limparBanco, prisma } from './ajudas'
import { dispositivoDo, origemDo } from '../src/metricas/metricas.service'

const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const CELULAR = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'

describe('métricas de acesso', () => {
  let app: INestApplication
  let token: string

  beforeAll(async () => { app = await criarApp() })
  beforeEach(async () => {
    await limparBanco()
    await criarEditora()
    token = (await request(app.getHttpServer()).post('/api/auth/entrar').send({ email: 'editora@citi.org.br', senha: 'senha-de-teste-123456' })).body.token
  })
  afterAll(async () => { await app.close(); await prisma.$disconnect() })

  const visitar = (corpo: object, agente = CHROME, ip = '203.0.113.5') => request(app.getHttpServer()).post('/api/metricas/visita').set('User-Agent', agente).set('X-Forwarded-For', ip).send(corpo)

  it('registra a página e a origem da entrada, sem guardar IP', async () => {
    const r = await visitar({ caminho: '/blog/noticias?continente=europa', entrada: true, referrer: 'https://www.instagram.com/citiufpe/', utm_source: 'instagram', utm_campaign: 'lancamento' })
    expect(r.status).toBe(204)
    const [visita] = await prisma.visita.findMany()
    expect(visita.caminho).toBe('/blog/noticias')
    expect(visita.origem).toBe('instagram.com')
    expect(visita.utm_campaign).toBe('lancamento')
    expect(visita.dispositivo).toBe('computador')
    expect(visita.visitante).toHaveLength(16)
    expect(JSON.stringify(visita)).not.toContain('203.0.113.5')
  })

  it('páginas seguintes da mesma visita não repetem a origem', async () => {
    await visitar({ caminho: '/blog/artigos', entrada: false, referrer: 'https://www.instagram.com/' })
    const [visita] = await prisma.visita.findMany()
    expect(visita.origem).toBeNull()
  })

  it('ignora robôs, o painel interno e caminhos inválidos', async () => {
    await visitar({ caminho: '/blog' }, 'Googlebot/2.1 (+http://www.google.com/bot.html)')
    await visitar({ caminho: '/blog/admin/noticias' })
    await visitar({ caminho: 'nao-comeca-com-barra' })
    await visitar({ caminho: '/blog' }, '')
    expect(await prisma.visita.count()).toBe(0)
  })

  it('o mesmo visitante tem o mesmo código no dia; outro IP gera outro código', async () => {
    await visitar({ caminho: '/blog', entrada: true })
    await visitar({ caminho: '/blog/artigos' })
    await visitar({ caminho: '/blog' , entrada: true }, CHROME, '198.51.100.9')
    const codigos = (await prisma.visita.findMany({ orderBy: { criado_em: 'asc' } })).map((v) => v.visitante)
    expect(codigos[0]).toBe(codigos[1])
    expect(codigos[2]).not.toBe(codigos[0])
  })

  it('o resumo do painel exige login e soma visitas, visitantes, páginas, origens e dispositivos', async () => {
    expect((await request(app.getHttpServer()).get('/api/admin/metricas')).status).toBe(401)
    await visitar({ caminho: '/blog', entrada: true, referrer: 'https://www.linkedin.com/feed/' })
    await visitar({ caminho: '/blog/artigos' })
    await visitar({ caminho: '/blog', entrada: true, referrer: '' }, CELULAR, '198.51.100.20')
    const r = await request(app.getHttpServer()).get('/api/admin/metricas?dias=7').set('Authorization', `Bearer ${token}`)
    expect(r.status).toBe(200)
    expect(r.body.dias).toBe(7)
    expect(r.body.visualizacoes).toBe(3)
    expect(r.body.visitas).toBe(2)
    expect(r.body.visitantes).toBe(2)
    expect(r.body.porDia).toHaveLength(7)
    expect(r.body.paginas[0]).toEqual({ caminho: '/blog', total: 2 })
    expect(r.body.origens.map((o: { origem: string }) => o.origem).sort()).toEqual(['direto', 'linkedin.com'])
    expect(r.body.dispositivos.map((d: { dispositivo: string }) => d.dispositivo).sort()).toEqual(['celular', 'computador'])
  })

  it('período fora da lista vira 30 dias', async () => {
    const r = await request(app.getHttpServer()).get('/api/admin/metricas?dias=999').set('Authorization', `Bearer ${token}`)
    expect(r.body.dias).toBe(30)
  })
})

describe('regras de métricas', () => {
  it('reconhece o tipo de aparelho', () => {
    expect(dispositivoDo(CELULAR)).toBe('celular')
    expect(dispositivoDo('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe('tablet')
    expect(dispositivoDo(CHROME)).toBe('computador')
  })

  it('links internos não contam como origem; sem referrer é acesso direto', () => {
    expect(origemDo('https://blog.citi.org.br/blog', ['blog.citi.org.br'])).toBeNull()
    expect(origemDo('', ['blog.citi.org.br'])).toBe('direto')
    expect(origemDo('https://www.google.com/', ['blog.citi.org.br'])).toBe('google.com')
  })
})
