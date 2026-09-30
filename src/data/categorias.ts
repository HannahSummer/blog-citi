export interface Category {
  slug: string
  label: string
  description: string
}

export const categories: Category[] = [
  { slug: 'negocios', label: 'Negócios', description: 'Problemas de negócio, crescimento e decisões estratégicas.' },
  { slug: 'solucoes', label: 'Soluções', description: 'Como problemas viram soluções digitais, do Discovery à entrega.' },
  { slug: 'inovacao', label: 'Inovação', description: 'Novas abordagens e tendências aplicadas ao negócio.' },
  { slug: 'institucional', label: 'Institucional', description: 'O CITi por dentro, com pessoas, cultura e conquistas.' },
  { slug: 'gestao', label: 'Gestão', description: 'Processos, operação, produtividade e tomada de decisão.' },
]

export function getCategory(slug: string | undefined) {
  return categories.find((category) => category.slug === slug)
}
