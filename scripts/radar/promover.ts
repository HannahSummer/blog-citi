/**
 * Transforma candidatos escolhidos do relatório em rascunhos de notícia.
 *
 *   npm run radar:promover -- <id> [<id> ...]
 *   npm run radar:promover -- --relatorio radar/relatorios/radar-2026-09-28.json <id>
 *
 * Os rascunhos vão para radar/rascunhos/ (fora de src/content, então NÃO aparecem no site).
 * Depois de escrever o resumo e o "por que importa", mova o arquivo para src/content/noticias/.
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PASTA_NOTICIAS, PASTA_RASCUNHOS, PASTA_RELATORIOS } from './config'
import type { Candidato } from './tipos'
import { dataISO } from './texto'

async function relatorioMaisRecente(): Promise<string> {
  const arquivos = (await readdir(PASTA_RELATORIOS)).filter((a) => a.endsWith('.json')).sort()
  if (!arquivos.length) throw new Error('Nenhum relatório encontrado. Rode `npm run radar` primeiro.')
  return join(PASTA_RELATORIOS, arquivos.at(-1)!)
}

function rascunho(c: Candidato): string {
  const data = c.data ? dataISO(new Date(c.data)) : dataISO(new Date())
  const esc = (s: string) => s.replace(/"/g, '\\"')
  return `---
title: "${esc(c.titulo)}"
date: "${data}"
categoria: "${c.categoriaSugerida}"
fonte: "${esc(c.fonte)}"
link: "${c.link}"
resumo: "TODO: 2 a 3 frases com as SUAS palavras. Não copie trechos da matéria."
---

TODO: Por que isso importa para o seu negócio? Um parágrafo curto com o olhar do CITi:
qual problema de negócio esta notícia revela, para quem ela importa e o que a empresa deveria se perguntar.

<!-- Revisão antes de publicar:
- [ ] Li a matéria original inteira
- [ ] Título reescrito, se o original for sensacionalista
- [ ] Resumo e "por que importa" escritos por mim, sem copiar a fonte
- [ ] Categoria conferida
- [ ] Link final da matéria (não o redirecionamento do Google Notícias)
- [ ] Removi este bloco de comentário
-->
`
}

async function main() {
  const args = process.argv.slice(2)
  const iRel = args.indexOf('--relatorio')
  const caminho = iRel >= 0 ? args[iRel + 1] : await relatorioMaisRecente()
  const ids = args.filter((a, i) => !a.startsWith('--') && (iRel < 0 || i !== iRel + 1))
  if (!ids.length) throw new Error('Informe pelo menos um id do relatório. Ex.: npm run radar:promover -- porto-digital-cresce-19')

  const candidatos: Candidato[] = JSON.parse(await readFile(caminho, 'utf8'))
  await mkdir(PASTA_RASCUNHOS, { recursive: true })

  for (const id of ids) {
    const c = candidatos.find((x) => x.id === id)
    if (!c) { console.warn(`id não encontrado no relatório: ${id}`); continue }
    const destino = join(PASTA_RASCUNHOS, `${id}.md`)
    if (existsSync(destino) || existsSync(join(PASTA_NOTICIAS, `${id}.md`))) { console.warn(`já existe, pulei: ${id}`); continue }
    await writeFile(destino, rascunho(c), 'utf8')
    console.log(`rascunho criado: ${destino}`)
  }
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1) })
