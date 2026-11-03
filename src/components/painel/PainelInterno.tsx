import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, NavLink } from 'react-router-dom'
import { AlertTriangle, ChartColumn, ExternalLink, Eye, EyeOff, LogOut, Newspaper, PenLine, Users } from 'lucide-react'
import { apiConfigurada } from '../../lib/api'
import { entrar, sair, sessaoAtual } from '../../services/painel'

type Acesso = 'carregando' | 'sem-api' | 'login' | 'editor'

// Moldura das páginas do painel interno (/blog/admin/*): menu lateral com as seções (Notícias, Contatos, Artigos, Métricas), título, login e saída.
// O painel não usa o cabeçalho e o rodapé do site (rotas fora do SiteLayout, em App.tsx).
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
    <div className="painel">
      {/* Menu lateral do painel (no celular vira uma barra no topo). */}
      <aside className="painel-lateral">
        <Link className="painel-logo" to="/blog/admin/noticias" aria-label="Painel interno do CITi"><img src="/assets/logo-citi.png" alt="CITi" /><span>Painel</span></Link>
        {acesso === 'editor' && <nav className="painel-nav" aria-label="Seções do painel">
          <NavLink to="/blog/admin/noticias"><Newspaper size={17} aria-hidden="true" /> Notícias</NavLink>
          <NavLink to="/blog/admin/leads"><Users size={17} aria-hidden="true" /> Contatos</NavLink>
          <NavLink to="/blog/admin/artigos"><PenLine size={17} aria-hidden="true" /> Artigos</NavLink>
          <NavLink to="/blog/admin/metricas"><ChartColumn size={17} aria-hidden="true" /> Métricas</NavLink>
        </nav>}
        <div className="painel-rodape">
          <Link className="painel-site" to="/blog" target="_blank"><ExternalLink size={15} aria-hidden="true" /> Ver o site</Link>
          {acesso === 'editor' && <button type="button" className="painel-sair" onClick={sairDaConta}><LogOut size={15} aria-hidden="true" /> Sair{email && <small>{email}</small>}</button>}
        </div>
      </aside>
      <main className="painel-conteudo">
        <div className="admin-head">
          <div><span className="eyebrow">Painel interno</span><h1>{titulo} <strong>{destaque}</strong></h1></div>
        </div>
        {acesso === 'carregando' && <p className="admin-muted">Carregando…</p>}
        {acesso === 'sem-api' && <p className="admin-aviso"><AlertTriangle size={16} /> A API não está configurada neste ambiente (VITE_API_URL). Veja docs/12-BACKEND-E-DEPLOY.md.</p>}
        {acesso === 'login' && <Login onEntrar={verificar} />}
        {acesso === 'editor' && children}
      </main>
    </div>
  </>
}

function Login({ onEntrar }: { onEntrar: () => void }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
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
    <label className="admin-field">Senha
      <span className="campo-senha">
        <input type={verSenha ? 'text' : 'password'} autoComplete="current-password" required value={senha} onChange={(event) => setSenha(event.target.value)} />
        <button type="button" onClick={() => setVerSenha((atual) => !atual)} aria-label={verSenha ? 'Esconder senha' : 'Mostrar senha'} aria-pressed={verSenha} title={verSenha ? 'Esconder senha' : 'Mostrar senha'}>
          {verSenha ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </span>
    </label>
    {erro && <p className="form-error" role="alert">{erro}</p>}
    <button type="submit" className="button-primary" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
  </form>
}
