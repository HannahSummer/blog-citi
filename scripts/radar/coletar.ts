import Parser from 'rss-parser'
import { FONTES, type Fonte } from './config'
import type { ItemBruto } from './tipos'
import { limparHtml } from './texto'

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'CITi-Radar/1.0 (+curadoria editorial do blog do CITi)' },
})

export interface ResultadoFonte {
  fonte: Fonte
  itens: ItemBruto[]
  erro?: string
}

export async function coletarFonte(fonte: Fonte): Promise<ResultadoFonte> {
  try {
    const feed = await parser.parseURL(fonte.url)
    return { fonte, itens: converter(feed.items ?? [], fonte) }
  } catch (e) {
    return { fonte, itens: [], erro: e instanceof Error ? e.message : String(e) }
  }
}

/** Usado nos testes: lê um XML local em vez de buscar na internet. */
export async function coletarDeXml(xml: string, fonte: Fonte): Promise<ResultadoFonte> {
  const feed = await parser.parseString(xml)
  return { fonte, itens: converter(feed.items ?? [], fonte) }
}

function converter(items: Parser.Item[], fonte: Fonte): ItemBruto[] {
  return items
    .filter((i) => i.title && i.link)
    .map((i) => ({
      titulo: limparHtml(i.title!),
      link: i.link!,
      resumo: limparHtml(i.contentSnippet || i.content || i.summary || '').slice(0, 400),
      data: i.isoDate ? new Date(i.isoDate) : i.pubDate ? new Date(i.pubDate) : null,
      fonte: fonte.nome,
      pesoFonte: fonte.peso,
    }))
}

export async function coletarTodas(): Promise<ResultadoFonte[]> {
  const ativas = FONTES.filter((f) => f.ativa)
  // Em série, com pausa curta, para não sobrecarregar os sites.
  const resultados: ResultadoFonte[] = []
  for (const fonte of ativas) {
    resultados.push(await coletarFonte(fonte))
    await new Promise((r) => setTimeout(r, 500))
  }
  return resultados
}
