export interface Continente {
  slug: string
  label: string
  // Ponto [longitude, latitude] para onde o globo gira ao escolher o continente.
  centro: [number, number]
  // Pontos de referência: um ponto de terra pertence ao continente da referência mais próxima.
  referencias: Array<[number, number]>
}

export const continentes: Continente[] = [
  { slug: 'america-do-sul', label: 'América do Sul', centro: [-58, -16], referencias: [[-60, -12], [-66, -36], [-73, 4]] },
  { slug: 'america-do-norte', label: 'América do Norte', centro: [-98, 38], referencias: [[-100, 48], [-90, 17], [-40, 72], [-150, 64], [-78, 22]] },
  { slug: 'europa', label: 'Europa', centro: [14, 50], referencias: [[10, 50], [28, 60], [-4, 40], [-18, 65], [22, 41]] },
  { slug: 'africa', label: 'África', centro: [20, 4], referencias: [[20, 4], [25, -22], [8, 22], [30, 24], [46, -19]] },
  { slug: 'asia', label: 'Ásia', centro: [95, 32], referencias: [[100, 45], [78, 22], [47, 30], [110, 2], [140, 38], [65, 52], [120, 65]] },
  { slug: 'oceania', label: 'Oceania', centro: [140, -25], referencias: [[135, -25], [172, -41], [145, -6]] },
]

export function getContinente(slug: string | null | undefined) {
  return continentes.find((continente) => continente.slug === slug)
}
