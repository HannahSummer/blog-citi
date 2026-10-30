import { describe, expect, it } from 'vitest'
import { formatarData } from './datas'

describe('formatarData', () => {
  it('formata data completa', () => {
    expect(formatarData('2026-10-30')).toBe('30 out 2026')
  })

  it('formata só mês e ano (momentos sem dia confirmado)', () => {
    expect(formatarData('2026-08')).toBe('ago 2026')
  })

  it('mantém só o ano quando for o único dado', () => {
    expect(formatarData('2025')).toBe('2025')
  })

  it('devolve o texto original quando não reconhece o formato', () => {
    expect(formatarData('em breve')).toBe('em breve')
  })
})
