import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { criarApp, limparBanco, prisma, sugestaoValida } from './ajudas'

const RADAR = 'Bearer radar-de-teste-com-mais-de-32-caracteres-0123456789'

describe('POST /api/radar/noticias', () => {
  let app: INestApplication
  beforeAll(async () => { app = await criarApp() })
  beforeEach(limparBanco)
  afterAll(async () => { await app.close(); await prisma.$disconnect() })

  const enviar = (corpo: unknown, autorizacao = RADAR) => request(app.getHttpServer()).post('/api/radar/noticias').set('Authorization', autorizacao).send(corpo as object)

  it('recusa sem token, com token errado e com token de tamanho diferente', async () => {
    expect((await request(app.getHttpServer()).post('/api/radar/noticias').send({ sugestoes: [] })).status).toBe(401)
    expect((await enviar({ sugestoes: [] }, 'Bearer errado-errado-errado-errado-errado-1234')).status).toBe(401)
    expect((await enviar({ sugestoes: [] }, 'Bearer curto')).status).toBe(401)
  })

  it('recusa corpo sem a lista de sugestões ou com mais de 50 itens', async () => {
    expect((await enviar({ sugestoes: 'nao-lista' })).status).toBe(400)
    const muitas = Array.from({ length: 51 }, (_, i) => sugestaoValida({ link: `https://exemplo.com/${i}` }))
    expect((await enviar({ sugestoes: muitas })).status).toBe(400)
  })

  it('grava as sugestões válidas como pendentes, com a semana convertida em data', async () => {
    const r = await enviar({ sugestoes: [sugestaoValida({ titulo: 'Primeira sugestão válida aqui' })] })
    expect(r.status).toBe(200)
    expect(r.body).toEqual({ enviadas: 1, repetidas: 0, erros: [] })
    const [noticia] = await prisma.noticia.findMany()
    expect(noticia.status).toBe('pendente')
    expect(noticia.semana.toISOString().slice(0, 10)).toBe('2026-10-26')
    expect(noticia.publicado_em).toBeNull()
  })

  it('ignora links repetidos e conta quantos já existiam', async () => {
    const sugestao = sugestaoValida({ link: 'https://exemplo.com/repetida' })
    await enviar({ sugestoes: [sugestao] })
    const r = await enviar({ sugestoes: [sugestao] })
    expect(r.body).toEqual({ enviadas: 0, repetidas: 1, erros: [] })
    expect(await prisma.noticia.count()).toBe(1)
  })

  it('um item inválido não derruba os outros; o erro aponta o campo', async () => {
    const r = await enviar({
      sugestoes: [
        sugestaoValida({ link: 'https://exemplo.com/ok-1' }),
        sugestaoValida({ link: 'https://exemplo.com/ruim', categoria: 'xyz' }),
        sugestaoValida({ link: 'https://exemplo.com/ok-2' }),
      ],
    })
    expect(r.body.enviadas).toBe(2)
    expect(r.body.erros).toHaveLength(1)
    expect(r.body.erros[0]).toMatch(/categoria/)
  })

  it('recusa data de semana fora do formato AAAA-MM-DD', async () => {
    const r = await enviar({ sugestoes: [sugestaoValida({ semana: '26/10/2026', link: 'https://exemplo.com/data' })] })
    expect(r.body.enviadas).toBe(0)
    expect(r.body.erros[0]).toMatch(/semana/)
  })
})
