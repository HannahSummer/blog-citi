import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { join } from 'node:path'

const root = process.cwd()
const postsDirectory = join(root, 'src', 'content', 'posts')
const categories = ['negocios', 'solucoes', 'gestao'] as const
const subthemes: Record<(typeof categories)[number], string[]> = {
  negocios: ['marketing-comercial'],
  solucoes: ['inovacao'],
  gestao: ['financeiro'],
}
const funnelStages = ['awareness', 'consideracao', 'intencao'] as const

function getArgument(name: string) {
  const index = process.argv.indexOf(`--${name}`)
  if (index >= 0) return process.argv[index + 1] ?? ''
  const prefix = `--${name}=`
  const inline = process.argv.find((argument) => argument.startsWith(prefix))
  return inline?.slice(prefix.length)
}

function slugify(title: string) {
  const stopwords = new Set(['a', 'as', 'ao', 'aos', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'o', 'os', 'para', 'por'])
  const words = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean).filter((word) => !stopwords.has(word))
  return words.slice(0, 6).join('-')
}

function today() {
  return new Date().toLocaleDateString('sv-SE')
}

async function main() {
  const readline = createInterface({ input, output })
  const ask = async (label: string, argument: string) => getArgument(argument) ?? (await readline.question(`${label}: `)).trim()
  try {
    const title = await ask('Título', 'titulo')
    if (!title) throw new Error('O título é obrigatório.')

    const categoryAnswer = await ask(`Categoria (1: negocios, 2: solucoes, 3: gestao)`, 'categoria')
    const category = categories[Number(categoryAnswer) - 1] ?? (categories.includes(categoryAnswer as typeof categories[number]) ? categoryAnswer as typeof categories[number] : undefined)
    if (!category) throw new Error('Categoria inválida.')

    const validSubthemes = subthemes[category]
    const subthemeAnswer = await ask(`Subtema opcional (${validSubthemes.join(', ') || 'nenhum'})`, 'subtema')
    const subtheme = subthemeAnswer && validSubthemes.includes(subthemeAnswer) ? subthemeAnswer : ''
    if (subthemeAnswer && !subtheme) throw new Error('Subtema inválido para a categoria escolhida.')

    const funnelAnswer = await ask('Etapa do funil (1: awareness, 2: consideracao, 3: intencao)', 'etapa_funil')
    const funnel = funnelStages[Number(funnelAnswer) - 1] ?? (funnelStages.includes(funnelAnswer as typeof funnelStages[number]) ? funnelAnswer as typeof funnelStages[number] : undefined)
    if (!funnel) throw new Error('Etapa do funil inválida.')

    const keywords = await ask('Palavra-chave principal e secundárias (separadas por vírgula)', 'palavras_chave')
    if (!keywords) throw new Error('Informe pelo menos uma palavra-chave.')

    const slug = slugify(title)
    if (!slug) throw new Error('Não foi possível gerar um slug a partir do título.')
    const destination = join(postsDirectory, `${slug}.md`)
    if (existsSync(destination)) throw new Error(`O arquivo ${slug}.md já existe. Nenhum arquivo foi alterado.`)

    mkdirSync(postsDirectory, { recursive: true })
    const subthemeLine = subtheme ? `subtema: "${subtheme}"\n` : ''
    const content = `---
title: "${title.replace(/"/g, '\\"')}"
excerpt: ""
meta_description: ""
date: "${today()}"
categoria: "${category}"
${subthemeLine}etapa_funil: "${funnel}"
cta_tipo: "diagnostico"
cover: ""
cover_alt: ""
author: ""
featured: false
draft: true
palavras_chave: "${keywords.replace(/"/g, '\\"')}"
---

<!-- Introdução: apresente o problema e o contexto para a pessoa leitora. -->

## Primeira seção

<!-- Desenvolva o primeiro ponto principal com exemplos e evidências. -->

## Segunda seção

<!-- Desenvolva o segundo ponto e conecte-o à realidade do negócio. -->

## Terceira seção

<!-- Desenvolva o terceiro ponto com recomendações práticas. -->

<!-- Fechamento: retome a ideia principal e indique o próximo passo. -->
`
    writeFileSync(destination, content, 'utf8')
    console.log(`Artigo criado em ${destination}`)
    console.log('Próximos passos: preencher excerpt, meta_description, author e cover; escrever o corpo; executar npm run validar-artigos.')
  } finally {
    readline.close()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
