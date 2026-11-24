/**
 * Rotina semanal completa do radar:
 * coleta → pontuação → copy escrita pelo Claude → sugestões no painel de aprovação.
 *
 *   npm run radar:semanal
 *
 * Variáveis de ambiente:
 *   ANTHROPIC_API_KEY                        → escreve a copy (sem ela, para depois do relatório)
 *   API_URL + RADAR_TOKEN                    → envia ao painel pela API (sem elas, só gera a prévia local)
 *
 * Sempre gera radar/relatorios/radar-AAAA-MM-DD.md e, com a copy, radar/sugestoes/semana-AAAA-MM-DD.md.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { MAX_PARA_REDACAO, MAX_SUGESTOES_SEMANA, type Categoria, type Subtema } from './config'
import { coletarTodas } from './coletar'
import { pontuar } from './pontuar'
import { escreverRelatorio } from './relatorio'
import { clienteClaude, redigir } from './redigir'
import { apiConfigurada, enviarSugestoes, type SugestaoNoticia } from './enviar'
import { dataISO } from './texto'

const PASTA_SUGESTOES = 'radar/sugestoes'
const PAI_DO_SUBTEMA: Record<Subtema, Categoria> = {
  marketing: 'negocios', vendas: 'negocios',
  dados: 'solucoes', desenvolvimento: 'solucoes', inovacao: 'solucoes', 'experiencia-do-cliente': 'solucoes',
  'gestao-empresarial': 'gestao', 'big-techs': 'gestao', financas: 'gestao',
}

function previa(sugestoes: SugestaoNoticia[], semana: string): string {
  const linhas = [`# Sugestões da semana — ${semana}`, '', 'Prévia local. A revisão acontece no painel /blog/admin/noticias.', '']
  for (const s of sugestoes) {
    linhas.push(`## ${s.titulo}`, `*${s.categoria}${s.subtema ? ` / ${s.subtema}` : ''} · ${s.fonte} · [fonte](${s.link})*`, '', s.resumo, '', `> **Por que importa** ${s.por_que_importa}`, '', `_Motivo: ${s.motivo}_`, '')
  }
  return linhas.join('\n')
}

async function main() {
  const hoje = new Date()
  const semana = dataISO(hoje)
  const resultados = await coletarTodas()
  const candidatos = pontuar(resultados.flatMap((r) => r.itens), hoje)
  const relatorio = await escreverRelatorio(candidatos, resultados, hoje)
  console.log(`${candidatos.length} candidatos no relatório: ${relatorio}`)

  const cliente = clienteClaude()
  if (!cliente) {
    console.log('ANTHROPIC_API_KEY ausente: parei no relatório, sem copy.')
    return
  }

  const sugestoes: SugestaoNoticia[] = []
  for (const candidato of candidatos.slice(0, MAX_PARA_REDACAO)) {
    if (sugestoes.length >= MAX_SUGESTOES_SEMANA) break
    const copy = await redigir(cliente, candidato)
    if (!copy) continue
    if (!copy.relevante) { console.log(`descartado pelo Claude: ${candidato.titulo} — ${copy.motivo}`); continue }
    sugestoes.push({
      semana,
      titulo: copy.titulo,
      resumo: copy.resumo,
      por_que_importa: copy.por_que_importa,
      categoria: copy.categoria,
      // O subtema só vale se pertencer à categoria escolhida.
      subtema: copy.subtema && PAI_DO_SUBTEMA[copy.subtema] === copy.categoria ? copy.subtema : null,
      continente: copy.continente,
      fonte: candidato.fonte,
      link: candidato.link,
      data_fonte: candidato.data ? dataISO(new Date(candidato.data)) : null,
      titulo_original: candidato.titulo,
      trecho_feed: candidato.resumo || null,
      motivo: copy.motivo,
      pontuacao: candidato.pontuacao,
    })
    console.log(`copy pronta: ${copy.titulo}`)
  }

  await mkdir(PASTA_SUGESTOES, { recursive: true })
  const arquivoPrevia = join(PASTA_SUGESTOES, `semana-${semana}.md`)
  await writeFile(arquivoPrevia, previa(sugestoes, semana), 'utf8')
  console.log(`${sugestoes.length} sugestões. Prévia: ${arquivoPrevia}`)

  if (!apiConfigurada()) {
    console.log('API_URL/RADAR_TOKEN ausentes: nada foi enviado ao painel.')
    return
  }
  const { enviadas, repetidas, erros } = await enviarSugestoes(sugestoes)
  console.log(`Painel: ${enviadas} enviadas, ${repetidas} já existiam.`)
  if (erros.length) { erros.forEach((erro) => console.error(`erro: ${erro}`)); process.exitCode = 1 }
}

main().catch((e) => { console.error(e); process.exit(1) })
