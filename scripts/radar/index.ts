/**
 * Radar de notícias — coleta os feeds, pontua e gera o relatório semanal.
 *
 *   npm run radar                    → gera radar/relatorios/radar-AAAA-MM-DD.md
 *   npm run radar -- --checar-fontes → só testa se cada feed responde
 */
import { FONTES } from './config'
import { coletarFonte, coletarTodas } from './coletar'
import { pontuar } from './pontuar'
import { escreverRelatorio } from './relatorio'

async function checarFontes() {
  console.log('Testando fontes...\n')
  for (const fonte of FONTES) {
    const r = await coletarFonte(fonte)
    const status = r.erro ? `ERRO  ${r.erro.slice(0, 90)}` : `OK    ${r.itens.length} itens`
    console.log(`${fonte.ativa ? ' ' : '(inativa) '}${status}  ${fonte.nome}`)
  }
  console.log('\nMarque `verificada: true` em config.ts nas fontes que responderam OK.')
}

async function main() {
  if (process.argv.includes('--checar-fontes')) return checarFontes()

  const resultados = await coletarTodas()
  const itens = resultados.flatMap((r) => r.itens)
  const candidatos = pontuar(itens)
  const arquivo = await escreverRelatorio(candidatos, resultados)

  const comErro = resultados.filter((r) => r.erro).length
  console.log(`${itens.length} itens coletados de ${resultados.length} fontes (${comErro} com erro).`)
  console.log(`${candidatos.length} candidatos no relatório: ${arquivo}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
