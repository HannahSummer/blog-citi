// Cliente da API do blog (pasta api/). O endereço vem de VITE_API_URL, gravado no build.
// Sem a variável, os formulários funcionam em modo demonstração (nada é gravado).
const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

export const apiConfigurada = Boolean(base)

if (!apiConfigurada) console.warn('[API] VITE_API_URL ausente. Formulários em modo demonstração.')

export class ErroApi extends Error {
  constructor(public readonly status: number, mensagem: string) { super(mensagem) }
}

export async function chamarApi<T>(caminho: string, opcoes: { metodo?: 'GET' | 'POST' | 'PATCH'; corpo?: unknown; token?: string | null; keepalive?: boolean } = {}): Promise<T> {
  const resposta = await fetch(`${base}/api${caminho}`, {
    method: opcoes.metodo ?? 'GET',
    headers: { ...(opcoes.corpo !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(opcoes.token ? { Authorization: `Bearer ${opcoes.token}` } : {}) },
    body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
    keepalive: opcoes.keepalive,
  })
  const dados = await resposta.json().catch(() => null)
  // A API responde os erros como { erro: 'mensagem' }.
  if (!resposta.ok) throw new ErroApi(resposta.status, dados?.erro ?? `Erro ${resposta.status}`)
  return dados as T
}
