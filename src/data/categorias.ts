export interface Category {
  slug: string
  label: string
  description: string
  capaPadrao: string
}

export const categories: Category[] = [
  { slug: 'negocios', label: 'Negócios', description: 'Problemas de negócio, crescimento e decisões estratégicas.', capaPadrao: '/images/covers/categorias/negocios.webp' },
  { slug: 'solucoes', label: 'Soluções', description: 'Como problemas viram soluções digitais, do Discovery à entrega.', capaPadrao: '/images/covers/categorias/solucoes.webp' },
  { slug: 'inovacao', label: 'Inovação', description: 'Novas abordagens e tendências aplicadas ao negócio.', capaPadrao: '/images/covers/categorias/inovacao.webp' },
  { slug: 'institucional', label: 'Institucional', description: 'O CITi por dentro, com pessoas, cultura e conquistas.', capaPadrao: '/images/covers/categorias/institucional.webp' },
  { slug: 'gestao', label: 'Gestão', description: 'Processos, operação, produtividade e tomada de decisão.', capaPadrao: '/images/covers/categorias/gestao.webp' },
]

export function getCategory(slug: string | undefined) {
  return categories.find((category) => category.slug === slug)
}
