import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { criarApp, criarEditora, limparBanco, prisma, sugestaoValida } from './ajudas'

const UUID_INEXISTENTE = '00000000-0000-4000-8000-000000000000'

describe('notícias: site público e painel de curadoria', () => {
  let app: INestApplication
  let token: string
  let editoraId: string

  beforeAll(async () => { app = await criarApp() })
  beforeEach(async () => {
    await limparBanco()
    const editora = await criarEditora()
    editoraId = editora.id
    const login = await request(app.getHttpServer()).post('/api/auth/entrar').send({ email: 'editora@citi.org.br', senha: 'senha-de-teste-123456' })
    token = login.body.token
  })
  afterAll(async () => { await app.close(); await prisma.$disconnect() })

  // Cria uma notícia direto no banco, já com um status, para os testes de leitura.
  async function criarNoticia(status: 'pendente' | 'aprovada' | 'rejeitada', extra: Record<string, unknown> = {}) {
    const dados = sugestaoValida(extra)
    return prisma.noticia.create({ data: { ...dados, semana: new Date(dados.semana), data_fonte: new Date(dados.data_fonte), status, publicado_em: status === 'aprovada' ? new Date() : null } as never })
  }

  describe('GET /api/noticias (público)', () => {
    it('lista só as aprovadas', async () => {
      await criarNoticia('pendente')
      await criarNoticia('rejeitada')
      await criarNoticia('aprovada', { titulo: 'Notícia aprovada para o público' })
      const r = await request(app.getHttpServer()).get('/api/noticias')
      expect(r.status).toBe(200)
      expect(r.body).toHaveLength(1)
      expect(r.body[0].titulo).toBe('Notícia aprovada para o público')
    })

    it('não expõe os campos internos de revisão', async () => {
      await criarNoticia('aprovada')
      const r = await request(app.getHttpServer()).get('/api/noticias')
      const campos = Object.keys(r.body[0])
      for (const interno of ['motivo', 'titulo_original', 'trecho_feed', 'pontuacao', 'revisado_por', 'status', 'criado_em']) expect(campos).not.toContain(interno)
    })
  })

  describe('painel (/api/admin/noticias)', () => {
    it('exige token de editora', async () => {
      const r = await request(app.getHttpServer()).get('/api/admin/noticias?status=pendente')
      expect(r.status).toBe(401)
    })

    it('recusa status desconhecido', async () => {
      const r = await request(app.getHttpServer()).get('/api/admin/noticias?status=inventado').set('Authorization', `Bearer ${token}`)
      expect(r.status).toBe(400)
    })

    it('lista as pendentes com os campos de revisão', async () => {
      await criarNoticia('pendente')
      await criarNoticia('aprovada')
      const r = await request(app.getHttpServer()).get('/api/admin/noticias?status=pendente').set('Authorization', `Bearer ${token}`)
      expect(r.status).toBe(200)
      expect(r.body).toHaveLength(1)
      expect(r.body[0]).toHaveProperty('motivo')
      expect(r.body[0]).toHaveProperty('titulo_original')
    })

    it('aprovar publica e carimba quem revisou; a notícia passa a aparecer no site', async () => {
      const noticia = await criarNoticia('pendente')
      const r = await request(app.getHttpServer()).patch(`/api/admin/noticias/${noticia.id}`).set('Authorization', `Bearer ${token}`).send({ status: 'aprovada' })
      expect(r.status).toBe(200)
      expect(r.body.status).toBe('aprovada')
      expect(r.body.publicado_em).not.toBeNull()
      expect(r.body.revisado_por).toBe(editoraId)
      const publico = await request(app.getHttpServer()).get('/api/noticias')
      expect(publico.body).toHaveLength(1)
    })

    it('tirar do ar limpa a publicação e a notícia some do site', async () => {
      const noticia = await criarNoticia('aprovada')
      const r = await request(app.getHttpServer()).patch(`/api/admin/noticias/${noticia.id}`).set('Authorization', `Bearer ${token}`).send({ status: 'pendente' })
      expect(r.body.publicado_em).toBeNull()
      const publico = await request(app.getHttpServer()).get('/api/noticias')
      expect(publico.body).toHaveLength(0)
    })

    it('editar o texto salva só o que foi enviado', async () => {
      const noticia = await criarNoticia('pendente')
      const r = await request(app.getHttpServer()).patch(`/api/admin/noticias/${noticia.id}`).set('Authorization', `Bearer ${token}`).send({ titulo: 'Título revisado pela curadoria' })
      expect(r.body.titulo).toBe('Título revisado pela curadoria')
      expect(r.body.status).toBe('pendente')
      expect(r.body.resumo).toBe(noticia.resumo)
    })

    it('recusa título fora do tamanho, com a mensagem apontando o campo', async () => {
      const noticia = await criarNoticia('pendente')
      const r = await request(app.getHttpServer()).patch(`/api/admin/noticias/${noticia.id}`).set('Authorization', `Bearer ${token}`).send({ titulo: 'curto' })
      expect(r.status).toBe(400)
      expect(r.body.erro).toMatch(/titulo/)
    })

    it('recusa categoria, subtema, continente e link inválidos', async () => {
      const noticia = await criarNoticia('pendente')
      const enviar = (corpo: object) => request(app.getHttpServer()).patch(`/api/admin/noticias/${noticia.id}`).set('Authorization', `Bearer ${token}`).send(corpo)
      expect((await enviar({ categoria: 'xyz' })).status).toBe(400)
      expect((await enviar({ subtema: 'inventado' })).status).toBe(400)
      expect((await enviar({ continente: 'marte' })).status).toBe(400)
      expect((await enviar({ link: 'ftp://nao-http' })).status).toBe(400)
      expect((await enviar({ status: 'talvez' })).status).toBe(400)
    })

    it('recusa link que já pertence a outra notícia', async () => {
      const primeira = await criarNoticia('pendente', { link: 'https://exemplo.com/a' })
      const segunda = await criarNoticia('pendente', { link: 'https://exemplo.com/b' })
      const r = await request(app.getHttpServer()).patch(`/api/admin/noticias/${segunda.id}`).set('Authorization', `Bearer ${token}`).send({ link: primeira.link })
      expect(r.status).toBe(400)
      expect(r.body.erro).toMatch(/Já existe/)
    })

    it('id inválido responde 400 e id inexistente responde 404', async () => {
      const invalido = await request(app.getHttpServer()).patch('/api/admin/noticias/nao-e-uuid').set('Authorization', `Bearer ${token}`).send({ status: 'pendente' })
      expect(invalido.status).toBe(400)
      const inexistente = await request(app.getHttpServer()).patch(`/api/admin/noticias/${UUID_INEXISTENTE}`).set('Authorization', `Bearer ${token}`).send({ status: 'pendente' })
      expect(inexistente.status).toBe(404)
    })
  })

  describe('cadastro manual (POST /api/admin/noticias)', () => {
    const manual = {
      titulo: 'Notícia cadastrada à mão pela curadoria',
      resumo: 'Resumo escrito pela curadoria com mais de quarenta caracteres para passar.',
      por_que_importa: 'Importa porque mostra o cadastro manual funcionando ponta a ponta no painel.',
      categoria: 'negocios',
      subtema: 'vendas',
      continente: 'america-do-sul',
      fonte: 'Fonte Manual',
      link: 'https://exemplo.com/manual',
    }
    const cadastrar = (corpo: object, autorizacao = `Bearer ${token}`) => request(app.getHttpServer()).post('/api/admin/noticias').set('Authorization', autorizacao).send(corpo)

    it('exige login de editora', async () => {
      expect((await request(app.getHttpServer()).post('/api/admin/noticias').send(manual)).status).toBe(401)
    })

    it('publica na hora, com a editora como revisora, e aparece no site', async () => {
      const r = await cadastrar(manual)
      expect(r.status).toBe(201)
      expect(r.body.status).toBe('aprovada')
      expect(r.body.publicado_em).not.toBeNull()
      expect(r.body.revisado_por).toBe(editoraId)
      expect(r.body.titulo_original).toBe(manual.titulo)
      const publico = await request(app.getHttpServer()).get('/api/noticias')
      expect(publico.body.map((n: { titulo: string }) => n.titulo)).toContain(manual.titulo)
    })

    it('recusa com as mesmas regras do radar, apontando o campo', async () => {
      const r = await cadastrar({ ...manual, titulo: 'curto', link: 'sem-protocolo' })
      expect(r.status).toBe(400)
      expect(r.body.erro).toMatch(/titulo/)
      expect(r.body.erro).toMatch(/link/)
    })

    it('recusa link que já existe', async () => {
      await cadastrar(manual)
      const r = await cadastrar({ ...manual, titulo: 'Outro título com tamanho suficiente' })
      expect(r.status).toBe(400)
      expect(r.body.erro).toMatch(/Já existe/)
    })
  })
})
