// Ajudas para validar o corpo das requisições (JSON vindo do site ou do radar).

export type Corpo = Record<string, unknown>

export const ehObjeto = (valor: unknown): valor is Corpo => typeof valor === 'object' && valor !== null && !Array.isArray(valor)
export const texto = (valor: unknown) => (typeof valor === 'string' ? valor.trim() : '')
// Opcional: vazio vira null; corta no limite do banco para o insert não falhar (origem, UTMs).
export const curto = (valor: unknown, max = 200) => texto(valor).slice(0, max) || null
export const entre = (valor: string, [min, max]: readonly [number, number]) => valor.length >= min && valor.length <= max
export const dataISO = (valor: unknown) => (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor) ? new Date(`${valor}T00:00:00Z`) : null)
