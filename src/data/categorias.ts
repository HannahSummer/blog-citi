export interface Category {
  slug: string
  label: string
  description: string
  capaPadrao: string
}

export const categories: Category[] = [
  { slug: 'negocios', label: 'Negócios', description: 'Marketing, vendas e as decisões que fazem a empresa crescer.', capaPadrao: '/images/covers/categorias/negocios.webp' },
  { slug: 'solucoes', label: 'Soluções', description: 'Dados, desenvolvimento, inovação e experiência do cliente: como problemas viram soluções digitais.', capaPadrao: '/images/covers/categorias/solucoes.webp' },
  { slug: 'gestao', label: 'Gestão', description: 'Gestão empresarial, finanças e o que os movimentos das big techs mudam no seu negócio.', capaPadrao: '/images/covers/categorias/gestao.webp' },
]

export function getCategory(slug: string | undefined) {
  return categories.find((category) => category.slug === slug)
}
