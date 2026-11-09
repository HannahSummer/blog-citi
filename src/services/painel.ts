import { apiConfigurada, chamarApi, ErroApi } from '../lib/api'

// Sessão do painel interno (/blog/admin/*). Só editoras cadastradas entram (ver docs/12-BACKEND-E-DEPLOY.md).
// O token do login fica no navegador por até 8 horas.

const CHAVE_TOKEN = 'citi-painel-token'
export const lerToken = () => { try { return localStorage.getItem(CHAVE_TOKEN) } catch { return null } }
const guardarToken = (token: string | null) => { try { if (token) localStorage.setItem(CHAVE_TOKEN, token); else localStorage.removeItem(CHAVE_TOKEN) } catch { /* navegador sem armazenamento */ } }

// E-mail da editora logada, ou null se não houver sessão válida.
export async function sessaoAtual(): Promise<string | null> {
  const token = lerToken()
  if (!apiConfigurada || !token) return null
  try {
    return (await chamarApi<{ email: string }>('/auth/eu', { token })).email
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 401) guardarToken(null)
    return null
  }
}

export async function entrar(email: string, senha: string): Promise<string | null> {
  if (!apiConfigurada) return 'API não configurada.'
  try {
    guardarToken((await chamarApi<{ token: string }>('/auth/entrar', { metodo: 'POST', corpo: { email: email.trim(), senha } })).token)
    return null
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 429) return 'Muitas tentativas. Espere um minuto e tente de novo.'
    return erro instanceof ErroApi && erro.status === 401 ? 'E-mail ou senha incorretos.' : 'Não foi possível entrar agora.'
  }
}

export function sair() { guardarToken(null) }
