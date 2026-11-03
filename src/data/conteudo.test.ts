import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { categories } from './categorias'
import { continentes } from './continentes'
import { getFotosIntercaladas, getMomentos } from './momentos'
import { news } from './noticias'
import { posts } from './posts'
import { subtemas } from './subtemas'
import { limitesNoticia } from '../config/noticias'

// Confere se o conteúdo em Markdown respeita as regras do site. Pega erro de digitação antes do deploy.
const categoriaIds = categories.map((categoria) => categoria.slug)
const subtemaIds = subtemas.map((subtema) => subtema.slug)
const continenteIds = continentes.map((continente) => continente.slug)
const publico = fileURLToPath(new URL('../../public', import.meta.url))

describe('artigos (src/content/posts)', () => {
  it('há artigos publicados', () => {
    expect(posts.length).toBeGreaterThan(0)
  })

  it.each(posts.map((post) => [post.slug, post] as const))('%s tem categoria e subtema válidos', (_slug, post) => {
    expect(categoriaIds).toContain(post.categorySlug)
    if (post.subtema) {
      const subtema = subtemas.find((item) => item.slug === post.subtema)
      expect(subtema, `subtema ${post.subtema} não existe`).toBeDefined()
      expect(subtema?.parentSlug).toBe(post.categorySlug)
    }
  })

  it.each(posts.map((post) => [post.slug, post] as const))('%s tem título, resumo e descrição para SEO', (_slug, post) => {
    expect(post.title.length).toBeGreaterThan(10)
    expect(post.excerpt.length).toBeGreaterThan(20)
    expect(post.metaDescription.length).toBeGreaterThan(20)
    expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('slugs são únicos', () => {
    const slugs = posts.map((post) => post.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('há no máximo um artigo em destaque', () => {
    expect(posts.filter((post) => post.featured).length).toBeLessThanOrEqual(1)
  })

  it('as capas referenciadas existem em public/', () => {
    for (const post of posts) {
      if (!post.cover) continue
      expect(existsSync(join(publico, post.cover)), `capa de ${post.slug}: ${post.cover}`).toBe(true)
    }
  })
})

describe('notícias escritas à mão (src/content/noticias)', () => {
  it.each(news.map((item) => [item.slug, item] as const))('%s tem categoria, fonte e link válidos', (_slug, item) => {
    expect(categoriaIds).toContain(item.categorySlug)
    expect(item.source.length).toBeGreaterThan(1)
    expect(item.link).toMatch(/^https?:\/\//)
  })

  it.each(news.filter((item) => item.continente).map((item) => [item.slug, item] as const))('%s tem continente válido para o globo', (_slug, item) => {
    expect(continenteIds).toContain(item.continente)
  })

  it('títulos respeitam o limite do banco (mesmas regras da curadoria)', () => {
    for (const item of news) {
      expect(item.title.length).toBeGreaterThanOrEqual(limitesNoticia.titulo[0])
      expect(item.title.length).toBeLessThanOrEqual(limitesNoticia.titulo[1])
    }
  })
})

describe('momentos do "Sobre o CITi" (src/content/momentos)', () => {
  const momentos = getMomentos()

  it('há momentos publicados e um destaque no máximo', () => {
    expect(momentos.length).toBeGreaterThan(0)
  })

  it.each(momentos.map((momento) => [momento.slug, momento] as const))('%s tem capa e fotos que existem em public/', (_slug, momento) => {
    const fotos = [momento.capa, ...momento.galeria.map((foto) => foto.src)].filter(Boolean)
    for (const foto of fotos) {
      expect(existsSync(join(publico, foto)), `foto ${foto} de ${momento.slug}`).toBe(true)
    }
  })

  it('a abertura do Sobre mostra cada foto uma única vez', () => {
    const fotos = getFotosIntercaladas().map((foto) => foto.src)
    expect(new Set(fotos).size).toBe(fotos.length)
    expect(fotos.length).toBeGreaterThan(0)
  })

  it('a intercalação não perde nem repete fotos de nenhum momento', () => {
    const esperadas = new Set(momentos.flatMap((momento) => [momento.capa, ...momento.galeria.map((foto) => foto.src)]).filter(Boolean))
    expect(new Set(getFotosIntercaladas().map((foto) => foto.src))).toEqual(esperadas)
  })
})
