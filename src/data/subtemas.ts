export interface Subtema {
  slug: string
  parentSlug: string
  label: string
}

export const subtemas: Subtema[] = [
  { slug: 'marketing', parentSlug: 'negocios', label: 'Marketing' },
  { slug: 'vendas', parentSlug: 'negocios', label: 'Vendas' },
  { slug: 'dados', parentSlug: 'solucoes', label: 'Dados' },
  { slug: 'desenvolvimento', parentSlug: 'solucoes', label: 'Desenvolvimento' },
  { slug: 'inovacao', parentSlug: 'solucoes', label: 'Inovação' },
  { slug: 'experiencia-do-cliente', parentSlug: 'solucoes', label: 'Experiência do cliente' },
  { slug: 'gestao-empresarial', parentSlug: 'gestao', label: 'Gestão empresarial' },
  { slug: 'big-techs', parentSlug: 'gestao', label: 'Big techs' },
  { slug: 'financas', parentSlug: 'gestao', label: 'Finanças' },
]

export function getSubtema(slug: string | undefined) {
  return subtemas.find((subtema) => subtema.slug === slug)
}