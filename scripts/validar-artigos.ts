import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parseFrontMatter, type FrontMatter } from '../src/lib/frontMatter'

const root = process.cwd()
const postsDirectory = join(root, 'src', 'content', 'posts')
const validCategories = new Set(['negocios', 'solucoes', 'gestao'])
const validFunnelStages = new Set(['awareness', 'consideracao', 'intencao'])
const validCtaTypes = new Set(['diagnostico', 'material-rico', 'newsletter'])
const validSubthemes: Record<string, string> = { 'marketing-comercial': 'negocios', inovacao: 'solucoes', financeiro: 'gestao' }
type Problem = { file: string; field: string; message: string }

const errors: Problem[] = []
const warnings: Problem[] = []
const add = (target: Problem[], file: string, field: string, message: string) => target.push({ file, field, message })
const value = (metadata: FrontMatter, key: string) => metadata[key]

function validate(file: string, metadata: FrontMatter, content: string) {
  const displayFile = relative(root, file)
  const required = ['title', 'excerpt', 'meta_description', 'date', 'categoria', 'etapa_funil', 'cta_tipo', 'author', 'palavras_chave']
  for (const field of required) if (typeof value(metadata, field) !== 'string' || !String(value(metadata, field)).trim()) add(errors, displayFile, field, 'campo obrigatório ausente ou vazio')

  const title = String(value(metadata, 'title') ?? '')
  if (title.length > 65) add(errors, displayFile, 'title', `possui ${title.length} caracteres; o limite é 65`)
  const metaDescription = String(value(metadata, 'meta_description') ?? '')
  if (metaDescription.length < 140 || metaDescription.length > 160) add(errors, displayFile, 'meta_description', `possui ${metaDescription.length} caracteres; o intervalo é 140 a 160`)

  const date = String(value(metadata, 'date') ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) add(errors, displayFile, 'date', 'deve usar o formato AAAA-MM-DD')
  const category = String(value(metadata, 'categoria') ?? '')
  if (!validCategories.has(category)) add(errors, displayFile, 'categoria', 'valor inválido; use negocios, solucoes ou gestao')
  const subtheme = String(value(metadata, 'subtema') ?? '')
  if (subtheme && validSubthemes[subtheme] !== category) add(errors, displayFile, 'subtema', 'não é válido para a categoria informada')
  if (!validFunnelStages.has(String(value(metadata, 'etapa_funil') ?? ''))) add(errors, displayFile, 'etapa_funil', 'valor inválido')
  if (!validCtaTypes.has(String(value(metadata, 'cta_tipo') ?? ''))) add(errors, displayFile, 'cta_tipo', 'valor inválido')
  if (value(metadata, 'cover')) {
    const cover = String(value(metadata, 'cover'))
    if (!cover.startsWith('/images/covers/') || !cover.endsWith('.webp')) add(errors, displayFile, 'cover', 'deve apontar para public/images/covers/ e terminar em .webp')
    else if (!existsSync(join(root, 'public', cover.replace(/^\//, '')))) add(warnings, displayFile, 'cover', 'arquivo de capa não encontrado')
    if (!String(value(metadata, 'cover_alt') ?? '').trim()) add(errors, displayFile, 'cover_alt', 'obrigatório quando há capa')
  }
  if (/^#\s+/m.test(content)) add(errors, displayFile, 'corpo', 'não pode conter título de nível 1')
  const words = content.split(/\s+/).filter(Boolean).length
  const funnel = String(value(metadata, 'etapa_funil') ?? '')
  const [minimum, maximum] = funnel === 'consideracao' ? [800, 1400] : funnel === 'awareness' ? [500, 900] : [0, Infinity]
  if (words < minimum || words > maximum) add(warnings, displayFile, 'corpo', `possui ${words} palavras; recomenda-se entre ${minimum} e ${maximum}`)
  if (!/\[[^\]]+\]\([^)]+\)|https?:\/\/\S+/.test(content)) add(warnings, displayFile, 'corpo', 'não possui link interno ou externo')
}

const files = readdirSync(postsDirectory).filter((file) => file.endsWith('.md')).sort()
const slugs = new Set<string>()
for (const filename of files) {
  const slug = filename.slice(0, -3)
  if (slugs.has(slug)) add(errors, join('src', 'content', 'posts', filename), 'slug', 'slug repetido')
  slugs.add(slug)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) add(errors, join('src', 'content', 'posts', filename), 'slug', 'use apenas minúsculas, números e hífens')
  const file = join(postsDirectory, filename)
  const parsed = parseFrontMatter(readFileSync(file, 'utf8'))
  validate(file, parsed.metadata, parsed.content)
}

const featuredFiles = files.filter((filename) => parseFrontMatter(readFileSync(join(postsDirectory, filename), 'utf8')).metadata.featured === true)
if (featuredFiles.length > 1) add(errors, 'src/content/posts', 'featured', `há ${featuredFiles.length} posts destacados; o máximo é 1`)

for (const problem of errors) console.error(`ERRO ${problem.file} [${problem.field}]: ${problem.message}`)
for (const problem of warnings) console.warn(`AVISO ${problem.file} [${problem.field}]: ${problem.message}`)
console.log(`Validação concluída: ${errors.length} erro(s), ${warnings.length} aviso(s).`)
process.exitCode = errors.length > 0 ? 1 : 0
