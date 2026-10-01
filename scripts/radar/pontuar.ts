import { BONUS_RECENTE, JANELA_DIAS, MAX_CANDIDATOS, PALAVRAS_POR_CATEGORIA, PONTUACAO_MINIMA, TERMOS_BLOQUEADOS, type Categoria } from './config'
import type { Candidato, ItemBruto } from './tipos'
import { normalizar, similaridade, slugify } from './texto'

const CATEGORIAS = Object.keys(PALAVRAS_POR_CATEGORIA) as Categoria[]

export function pontuar(itens: ItemBruto[], agora = new Date()): Candidato[] {
  const limite = agora.getTime() - JANELA_DIAS * 86_400_000

  const candidatos = itens
    .filter((i) => !i.data || i.data.getTime() >= limite)
    .filter((i) => !TERMOS_BLOQUEADOS.some((t) => normalizar(i.titulo).includes(t)))
    .map((i) => avaliar(i, agora))
    .filter((c) => c.pontuacao >= PONTUACAO_MINIMA)
    .sort((a, b) => b.pontuacao - a.pontuacao)

  return deduplicar(candidatos).slice(0, MAX_CANDIDATOS)
}

function avaliar(item: ItemBruto, agora: Date): Candidato {
  const titulo = normalizar(item.titulo)
  const resumo = normalizar(item.resumo)
  const pontosPorCategoria = Object.fromEntries(CATEGORIAS.map((c) => [c, 0])) as Record<Categoria, number>
  const encontradas = new Set<string>()

  for (const cat of CATEGORIAS) {
    for (const palavra of PALAVRAS_POR_CATEGORIA[cat]) {
      if (titulo.includes(palavra)) { pontosPorCategoria[cat] += 2; encontradas.add(palavra.trim()) }
      else if (resumo.includes(palavra)) { pontosPorCategoria[cat] += 1; encontradas.add(palavra.trim()) }
    }
  }

  const base = Object.values(pontosPorCategoria).reduce((a, b) => a + b, 0)
  const recente = item.data && agora.getTime() - item.data.getTime() < 2 * 86_400_000 ? BONUS_RECENTE : 0
  const categoriaSugerida = CATEGORIAS.reduce((melhor, c) => (pontosPorCategoria[c] > pontosPorCategoria[melhor] ? c : melhor), CATEGORIAS[0])

  return {
    ...item,
    id: slugify(item.titulo),
    pontuacao: base > 0 ? base * item.pesoFonte + recente : 0,
    categoriaSugerida,
    pontosPorCategoria,
    palavrasEncontradas: [...encontradas],
  }
}

/** Remove a mesma notícia vinda de fontes diferentes, mantendo a de maior pontuação. */
function deduplicar(lista: Candidato[]): Candidato[] {
  const mantidos: Candidato[] = []
  for (const c of lista) {
    const repetido = mantidos.find((m) => m.link === c.link || similaridade(m.titulo, c.titulo) >= 0.6)
    if (!repetido) mantidos.push(c)
  }
  return mantidos
}
