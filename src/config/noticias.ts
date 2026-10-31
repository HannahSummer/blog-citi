// Regras da curadoria de notícias, usadas pelo painel (/blog/admin/noticias) e pela API.
// Espelham os CHECK da tabela `noticias` (api/prisma/migrations). Ao mudar aqui, mude lá também.

export const statusNoticia = ['pendente', 'aprovada', 'rejeitada'] as const
export type StatusNoticia = (typeof statusNoticia)[number]

// [mínimo, máximo] de caracteres.
export const limitesNoticia = {
  titulo: [10, 160],
  resumo: [40, 600],
  por_que_importa: [40, 900],
  fonte: [2, 120],
} as const
