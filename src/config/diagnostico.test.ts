import { describe, expect, it } from 'vitest'
import { buscarNivel, calcularResultado, comoConheceuOpcoes, diagnosticoNiveis, diagnosticoPerguntas, PONTUACAO_MAXIMA, type Respostas } from './diagnostico'

// Respostas com a soma pedida, distribuindo os pontos de 2 em 2 pelas perguntas.
function respostasComSoma(soma: number): Respostas {
  const respostas: Respostas = {}
  let restante = soma
  for (const pergunta of diagnosticoPerguntas) {
    const valor = Math.min(2, restante)
    respostas[pergunta.id] = valor
    restante -= valor
  }
  return respostas
}

describe('diagnóstico: pontuação e níveis', () => {
  it('tem 6 perguntas e pontuação máxima de 12', () => {
    expect(diagnosticoPerguntas).toHaveLength(6)
    expect(PONTUACAO_MAXIMA).toBe(12)
  })

  it('cada pergunta tem opções valendo 0, 1 e 2 pontos', () => {
    for (const pergunta of diagnosticoPerguntas) {
      expect(pergunta.options.map((opcao) => opcao.points).sort()).toEqual([0, 1, 2])
    }
  })

  it('soma os pontos de cada pergunta', () => {
    expect(calcularResultado(respostasComSoma(8)).pontuacao).toBe(8)
    expect(calcularResultado(respostasComSoma(12)).pontuacao).toBe(12)
    expect(calcularResultado({}).pontuacao).toBe(0)
  })

  // Limites das faixas (documento 11): 0–3 inicial, 4–6 organização, 7–9 evolução, 10–12 estruturado.
  it.each([
    [0, 'inicial'], [3, 'inicial'], [4, 'organizacao'], [6, 'organizacao'],
    [7, 'evolucao'], [9, 'evolucao'], [10, 'estruturado'], [12, 'estruturado'],
  ])('a pontuação %i cai no nível %s', (soma, nivel) => {
    expect(calcularResultado(respostasComSoma(soma)).nivel).toBe(nivel)
  })

  it('ignora resposta fora de 0 a 2 (conta como zero)', () => {
    const respostas = { ...respostasComSoma(6), processos: 9 as never }
    expect(calcularResultado(respostas).pontuacao).toBe(4)
  })

  it('todo nível tem nome e descrição, e os limites são crescentes', () => {
    const maximos = diagnosticoNiveis.map((nivel) => nivel.max)
    expect(maximos).toEqual([...maximos].sort((a, b) => a - b))
    for (const nivel of diagnosticoNiveis) {
      expect(nivel.label.length).toBeGreaterThan(0)
      expect(nivel.description.length).toBeGreaterThan(20)
    }
  })

  it('buscarNivel devolve o nível pedido', () => {
    expect(buscarNivel('evolucao').label).toBe('Em evolução')
  })

  it('as opções de "como conheceu" batem com a lista que a API aceita', () => {
    expect(comoConheceuOpcoes.map((opcao) => opcao.value)).toEqual(['linkedin', 'instagram', 'indicacao', 'google', 'blog', 'evento', 'outro'])
  })
})
