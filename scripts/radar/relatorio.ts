import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { JANELA_DIAS, PASTA_RELATORIOS } from './config'
import type { ResultadoFonte } from './coletar'
import type { Candidato } from './tipos'
import { dataISO } from './texto'

export async function escreverRelatorio(candidatos: Candidato[], fontes: ResultadoFonte[], hoje = new Date()): Promise<string> {
  const arquivo = join(PASTA_RELATORIOS, `radar-${dataISO(hoje)}.md`)
  await mkdir(PASTA_RELATORIOS, { recursive: true })
  await writeFile(arquivo, montar(candidatos, fontes, hoje), 'utf8')
  // Também salva em JSON para o comando `radar:promover` usar.
  await writeFile(arquivo.replace(/\.md$/, '.json'), JSON.stringify(candidatos, null, 2), 'utf8')
  return arquivo
}

function montar(candidatos: Candidato[], fontes: ResultadoFonte[], hoje: Date): string {
  const linhas: string[] = []
  linhas.push(`# Radar da semana — ${dataISO(hoje)}`, '')
  linhas.push(`Candidatos dos últimos ${JANELA_DIAS} dias, ordenados por aderência. Este relatório é só uma **triagem**: nada aqui é publicado automaticamente.`, '')
  linhas.push('**Como usar:** escolha de 3 a 5 itens, leia a matéria original e rode `npm run radar:promover -- <id> <id> ...` para gerar os rascunhos em `radar/rascunhos/`.', '')

  linhas.push('## Candidatos', '')
  if (!candidatos.length) linhas.push('_Nenhum candidato atingiu a pontuação mínima esta semana. Revise as palavras-chave em `scripts/radar/config.ts`._', '')
  candidatos.forEach((c, i) => {
    linhas.push(`### ${i + 1}. ${c.titulo}`)
    linhas.push(`- **id:** \`${c.id}\``)
    linhas.push(`- **Fonte:** ${c.fonte} · ${c.data ? dataISO(c.data) : 'sem data'} · [abrir matéria](${c.link})`)
    linhas.push(`- **Pontuação:** ${c.pontuacao} · **categoria sugerida:** ${c.categoriaSugerida}`)
    linhas.push(`- **Palavras encontradas:** ${c.palavrasEncontradas.join(', ') || '—'}`)
    if (c.resumo) linhas.push(`- **Trecho do feed (não copiar para o blog):** ${c.resumo.slice(0, 220)}${c.resumo.length > 220 ? '…' : ''}`)
    linhas.push('')
  })

  linhas.push('## Saúde das fontes', '')
  linhas.push('| Fonte | Itens | Status |', '|---|---|---|')
  for (const r of fontes) linhas.push(`| ${r.fonte.nome} | ${r.itens.length} | ${r.erro ? `erro: ${r.erro.slice(0, 80)}` : 'ok'} |`)
  linhas.push('')
  return linhas.join('\n')
}
