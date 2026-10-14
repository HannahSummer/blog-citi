export interface Subtema {
  slug: string
  parentSlug: string
  label: string
}

export const subtemas: Subtema[] = [
  { slug: 'marketing-comercial', parentSlug: 'negocios', label: 'Marketing e comercial' },
  { slug: 'inovacao', parentSlug: 'solucoes', label: 'Inovação' },
  { slug: 'financeiro', parentSlug: 'gestao', label: 'Financeiro' },
]

export function getSubtema(slug: string | undefined) {
  return subtemas.find((subtema) => subtema.slug === slug)
}