import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Helmet } from 'react-helmet-async'
import { NavLink } from 'react-router-dom'
import { AlertTriangle, LogOut } from 'lucide-react'
import { apiConfigurada } from '../../lib/api'
import { entrar, sair, sessaoAtual } from '../../services/painel'

type Acesso = 'carregando' | 'sem-api' | 'login' | 'editor'

// Moldura das páginas do painel interno (/blog/admin/*): título, abas Notícias/Leads, login e saída.
// O conteúdo só aparece para editoras logadas; a API confere o token em toda chamada.
export function PainelInterno({ titulo, destaque, children }: { titulo: string; destaque: string; children: ReactNode }) {
  const [acesso, setAcesso] = useState<Acesso>('carregando')
  const [email, setEmail] = useState('')

  const verificar = useCallback(async () => {
    if (!apiConfigurada) return setAcesso('sem-api')
    // Sessão vencida (8 horas) ou conta desativada volta para o login.
    const emailDaSessao = await sessaoAtual()
    if (!emailDaSessao) return setAcesso('login')
    setEmail(emailDaSessao)
    setAcesso('editor')
  }, [])

  useEffect(() => { verificar() }, [verificar])

  const sairDaConta = () => { sair(); setAcesso('login') }

  return <><Helmet><title>{`${titulo} ${destaque.replace(/\.$/, '')} | Painel CITi`}</title><meta name="robots" content="noindex, nofollow" /></Helmet>
    <section className="admin-page container">
      <div className="admin-head">
        <div><span className="eyebrow">Painel interno</span><h1>{titulo} <strong>{destaque}</strong></h1></div>
        {acesso === 'editor' ? <button type="button" className="button-secondary" onClick={sairDaConta}><LogOut size={15} /> Sair{email && <small>{email}</small>}</button> : null}
      </div>
      {acesso === 'editor' && <nav className="admin-nav" aria-label="Seções do painel"><NavLink to="/blog/admin/noticias">Notícias</NavLink><NavLink to="/blog/admin/leads">Leads e newsletter</NavLink></nav>}
      {acesso === 'carregando' && <p className="admin-muted">Carregando…</p>}
      {acesso === 'sem-api' && <p className="admin-aviso"><AlertTriangle size={16} /> A API não está configurada neste ambiente (VITE_API_URL). Veja docs/12-BACKEND-E-DEPLOY.md.</p>}
      {acesso === 'login' && <Login onEntrar={verificar} />}
      {acesso === 'editor' && children}
    </section>
  </>
}

function Login({ onEntrar }: { onEntrar: () => void }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setEnviando(true)
    const falha = await entrar(email, senha)
    setEnviando(false)
    if (falha) setErro(falha)
    else onEntrar()
  }
  return <form className="admin-login" onSubmit={submit}>
    <p>Entre com a conta de editora. O cadastro é feito por quem cuida da API (docs/12-BACKEND-E-DEPLOY.md).</p>
    <label className="admin-field">E-mail<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
    <label className="admin-field">Senha<input type="password" autoComplete="current-password" required value={senha} onChange={(event) => setSenha(event.target.value)} /></label>
    {erro && <p className="form-error" role="alert">{erro}</p>}
    <button type="submit" className="button-primary" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
  </form>
}
