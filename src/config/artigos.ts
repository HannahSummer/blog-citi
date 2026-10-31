// Regras dos artigos do blog, usadas em três lugares para nunca divergirem:
// o build (scripts/validar-artigos.ts), o formulário do painel (/blog/admin/artigos) e a API que faz o commit.
// Se o painel aceitar um artigo, o build também aceita, e o deploy no Coolify não quebra.
import { categories } from '../data/categorias'
import { subtemas } from '../data/subtemas'

export const etapasFunil = [
  { value: 'awareness', label: 'Descoberta', ajuda: 'Para quem ainda está entendendo o problema (500 a 900 palavras).' },
  { value: 'consideracao', label: 'Consideração', ajuda: 'Para quem compara caminhos e soluções (800 a 1400 palavras).' },
  { value: 'intencao', label: 'Intenção', ajuda: 'Para quem está perto de decidir.' },
] as const

export const tiposCta = [
  { value: 'newsletter', label: 'Assinar a newsletter' },
  { value: 'diagnostico', label: 'Fazer o diagnóstico' },
  { value: 'material-rico', label: 'Baixar um material' },
] as const

export const limitesArtigo = {
  titulo: 65,
  metaDescription: [140, 160] as const,
}

// Campos obrigatórios no front matter (o build recusa o artigo sem eles).
export const camposObrigatorios = ['title', 'excerpt', 'meta_description', 'date', 'categoria', 'etapa_funil', 'cta_tipo', 'author', 'palavras_chave'] as const

export const SLUG_VALIDO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const DATA_VALIDA = /^\d{4}-\d{2}-\d{2}$/

export const categoriaValida = (slug: string) => categories.some((categoria) => categoria.slug === slug)
export const subtemaDaCategoria = (subtema: string, categoria: string) => subtemas.some((item) => item.slug === subtema && item.parentSlug === categoria)

export interface ArtigoCampos {
  titulo: string
  resumo: string
  metaDescription: string
  data: string
  categoria: string
  subtema: string
  etapaFunil: string
  ctaTipo: string
  autor: string
  palavrasChave: string
  corpo: string
  rascunho: boolean
}

export type ErrosArtigo = Partial<Record<keyof ArtigoCampos | 'slug', string>>

// "Como aparecer no ChatGPT: guia" -> "como-aparecer-no-chatgpt-guia"
export function slugDoTitulo(titulo: string) {
  return titulo.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '')
}

// Mesmas regras do build, com mensagens para quem preenche o formulário.
export function validarArtigo(campos: ArtigoCampos): ErrosArtigo {
  const erros: ErrosArtigo = {}
  const titulo = campos.titulo.trim()
  if (!titulo) erros.titulo = 'Informe o título.'
  else if (titulo.length > limitesArtigo.titulo) erros.titulo = `Use no máximo ${limitesArtigo.titulo} caracteres (hoje tem ${titulo.length}).`
  if (!campos.resumo.trim()) erros.resumo = 'Informe o resumo que aparece nos cards.'
  const meta = campos.metaDescription.trim().length
  const [metaMin, metaMax] = limitesArtigo.metaDescription
  if (meta < metaMin || meta > metaMax) erros.metaDescription = `A descrição para o Google precisa ter de ${metaMin} a ${metaMax} caracteres (hoje tem ${meta}).`
  if (!DATA_VALIDA.test(campos.data)) erros.data = 'Use uma data no formato AAAA-MM-DD.'
  if (!categoriaValida(campos.categoria)) erros.categoria = 'Escolha uma categoria.'
  if (campos.subtema && !subtemaDaCategoria(campos.subtema, campos.categoria)) erros.subtema = 'Esse subtema não pertence à categoria escolhida.'
  if (!etapasFunil.some((etapa) => etapa.value === campos.etapaFunil)) erros.etapaFunil = 'Escolha a etapa do funil.'
  if (!tiposCta.some((cta) => cta.value === campos.ctaTipo)) erros.ctaTipo = 'Escolha a chamada do fim do artigo.'
  if (!campos.autor.trim()) erros.autor = 'Informe o autor.'
  if (!campos.palavrasChave.trim()) erros.palavrasChave = 'Informe ao menos uma palavra-chave.'
  if (!campos.corpo.trim()) erros.corpo = 'Escreva o texto do artigo.'
  else if (/^#\s+/m.test(campos.corpo)) erros.corpo = 'Não use título de nível 1 (# Título) no texto; o título do artigo já é o principal. Use ## para seções.'
  const slug = slugDoTitulo(titulo)
  if (titulo && !SLUG_VALIDO.test(slug)) erros.slug = 'Não foi possível gerar o endereço do artigo a partir do título.'
  return erros
}

// Cada valor fica numa linha só: o leitor de front matter (src/lib/frontMatter.ts) lê uma linha por campo.
const linha = (valor: string) => `"${valor.replace(/[\r\n]+/g, ' ').trim()}"`

// Gera o arquivo .md no mesmo formato dos artigos existentes em src/content/posts/.
export function montarMarkdown(campos: ArtigoCampos) {
  return [
    '---',
    `title: ${linha(campos.titulo)}`,
    `excerpt: ${linha(campos.resumo)}`,
    `meta_description: ${linha(campos.metaDescription)}`,
    `date: ${linha(campos.data)}`,
    `categoria: ${linha(campos.categoria)}`,
    `subtema: ${linha(campos.subtema)}`,
    `etapa_funil: ${linha(campos.etapaFunil)}`,
    `cta_tipo: ${linha(campos.ctaTipo)}`,
    'cta_link: ""',
    `author: ${linha(campos.autor)}`,
    'featured: false',
    `draft: ${campos.rascunho ? 'true' : 'false'}`,
    `palavras_chave: ${linha(campos.palavrasChave)}`,
    '---',
    '',
    campos.corpo.replace(/\r\n/g, '\n').trim(),
    '',
  ].join('\n')
}
