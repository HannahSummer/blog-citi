import type { Categoria } from './config'

export interface ItemBruto {
  titulo: string
  link: string
  resumo: string
  data: Date | null
  fonte: string
  pesoFonte: number
}

export interface Candidato extends ItemBruto {
  id: string
  pontuacao: number
  categoriaSugerida: Categoria
  pontosPorCategoria: Record<Categoria, number>
  palavrasEncontradas: string[]
}
