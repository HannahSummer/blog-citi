import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { AlertTriangle, Check, ExternalLink, Eye, PenLine, Plus, X } from 'lucide-react'
import { PainelInterno } from '../../components/painel/PainelInterno'
import { etapasFunil, limitesArtigo, slugDoTitulo, tiposCta, validarArtigo, type ArtigoCampos, type ErrosArtigo } from '../../config/artigos'
import { categories } from '../../data/categorias'
import { subtemas } from '../../data/subtemas'
import { posts } from '../../data/posts'
import { formatarData } from '../../lib/datas'
import { configuracaoArtigos, publicarArtigo, type ArtigoPublicado, type ConfiguracaoArtigos } from '../../services/artigos'

const hoje = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Recife' })
const novo = (): ArtigoCampos => ({ titulo: '', resumo: '', metaDescription: '', data: hoje(), categoria: categories[0].slug, subtema: '', etapaFunil: 'awareness', ctaTipo: 'newsletter', autor: 'Equipe CITi', palavrasChave: '', corpo: '', rascunho: false })
// Faixa de palavras recomendada por etapa (a mesma que o build usa nos avisos).
const faixaDePalavras: Record<string, [number, number] | null> = { awareness: [500, 900], consideracao: [800, 1400], intencao: null }

export function AdminArtigos() {
  return <PainelInterno titulo="Artigos do" destaque="blog."><Artigos /></PainelInterno>
}

function Artigos() {
  const [config, setConfig] = useState<ConfiguracaoArtigos | null>(null)
  const [escrevendo, setEscrevendo] = useState(false)
  const [publicado, setPublicado] = useState<ArtigoPublicado | null>(null)

  useEffect(() => { configuracaoArtigos().then(setConfig).catch(() => setConfig({ configurado: false, repositorio: null, branch: '' })) }, [])

  return <div className="admin-fila">
    <div className="contatos-topo">
      <p className="admin-muted">Cada artigo novo vira um arquivo no GitHub e vai ao ar sozinho em cerca de 2 minutos, quando o Coolify termina de publicar.</p>
      {!escrevendo && <button type="button" className="button-primary" onClick={() => { setEscrevendo(true); setPublicado(null) }} disabled={config?.configurado === false}><Plus size={16} /> Novo artigo</button>}
    </div>

    {config?.configurado === false && <p className="admin-aviso"><AlertTriangle size={16} /> A publicação pelo painel ainda não foi configurada: faltam as variáveis GITHUB_TOKEN e GITHUB_REPO na API do Coolify (docs/12-BACKEND-E-DEPLOY.md, seção Artigos pelo painel).</p>}

    {publicado && <div className="admin-card admin-publicado" role="status">
      <h2><Check size={18} /> {publicado.rascunho ? 'Rascunho salvo no GitHub.' : 'Artigo enviado para publicação.'}</h2>
      <p>{publicado.rascunho
        ? 'Ele não aparece no site. Para publicar, edite o arquivo no GitHub e troque draft: true por draft: false.'
        : `Em cerca de 2 minutos ele aparece em /blog/artigos/${publicado.slug}. Se não aparecer, confira o deploy no Coolify.`}</p>
      <div className="admin-actions">
        {!publicado.rascunho && <Link className="button-secondary" to={`/blog/artigos/${publicado.slug}`} target="_blank"><Eye size={15} /> Ver no site</Link>}
        {publicado.commit && <a className="button-secondary" href={publicado.commit} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> Ver no GitHub</a>}
      </div>
    </div>}

    {escrevendo && <FormularioArtigo onCancelar={() => setEscrevendo(false)} onPublicado={(resultado) => { setPublicado(resultado); setEscrevendo(false) }} />}

    <h2 className="admin-secao-titulo">No ar agora <b>{posts.length}</b></h2>
    <ul className="artigos-lista">
      {posts.map((post) => <li key={post.slug}>
        <div><strong>{post.title}</strong><small>{post.category}{post.subtema ? ` · ${subtemas.find((item) => item.slug === post.subtema)?.label ?? ''}` : ''} · {formatarData(post.date)} · {post.readTime}</small></div>
        <Link to={`/blog/artigos/${post.slug}`} target="_blank" aria-label={`Abrir "${post.title}" no site`}><ExternalLink size={15} /></Link>
      </li>)}
    </ul>
    <p className="admin-muted admin-nota">Para corrigir um artigo que já está no ar, edite o arquivo em src/content/posts/ no GitHub (guia docs/11-COMO-CRIAR-ARTIGO.md).</p>
  </div>
}

function FormularioArtigo({ onCancelar, onPublicado }: { onCancelar: () => void; onPublicado: (resultado: ArtigoPublicado) => void }) {
  const [campos, setCampos] = useState<ArtigoCampos>(novo)
  const [erros, setErros] = useState<ErrosArtigo>({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [previa, setPrevia] = useState(false)
  const update = <K extends keyof ArtigoCampos>(campo: K, valor: ArtigoCampos[K]) => setCampos((atual) => ({ ...atual, [campo]: valor }))

  const slug = slugDoTitulo(campos.titulo)
  const palavras = campos.corpo.split(/\s+/).filter(Boolean).length
  const faixa = faixaDePalavras[campos.etapaFunil]
  const [metaMin, metaMax] = limitesArtigo.metaDescription
  const meta = campos.metaDescription.trim().length

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    const encontrados = validarArtigo(campos)
    setErros(encontrados)
    if (Object.keys(encontrados).length) { setErroGeral('Revise os campos destacados.'); return }
    setEnviando(true); setErroGeral('')
    try {
      onPublicado(await publicarArtigo(campos))
    } catch (e) {
      setErroGeral((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  const erroDe = (campo: keyof ErrosArtigo) => erros[campo] && <small className="form-error">{erros[campo]}</small>

  return <form className="admin-card admin-nova" onSubmit={enviar} aria-labelledby="novo-artigo-titulo" noValidate>
    <header className="admin-nova-topo">
      <h2 id="novo-artigo-titulo"><PenLine size={18} /> Novo artigo</h2>
      <p className="admin-muted">Os campos seguem as mesmas regras do build: se o painel aceitar, o deploy não quebra. Use ## para as seções do texto.</p>
    </header>

    <label className="admin-field">Título
      <input value={campos.titulo} onChange={(event) => update('titulo', event.target.value)} aria-invalid={Boolean(erros.titulo) || undefined} />
      <small className={campos.titulo.trim().length > limitesArtigo.titulo ? 'admin-contador fora' : 'admin-contador'}>{campos.titulo.trim().length} / {limitesArtigo.titulo}</small>
      {slug && <small className="admin-muted">Endereço: /blog/artigos/{slug}</small>}
      {erroDe('titulo')}{erroDe('slug')}
    </label>
    <label className="admin-field">Resumo (aparece nos cards)
      <textarea rows={2} value={campos.resumo} onChange={(event) => update('resumo', event.target.value)} aria-invalid={Boolean(erros.resumo) || undefined} />
      {erroDe('resumo')}
    </label>
    <label className="admin-field">Descrição para o Google
      <textarea rows={3} value={campos.metaDescription} onChange={(event) => update('metaDescription', event.target.value)} aria-invalid={Boolean(erros.metaDescription) || undefined} />
      <small className={meta < metaMin || meta > metaMax ? 'admin-contador fora' : 'admin-contador'}>{meta} (entre {metaMin} e {metaMax})</small>
      {erroDe('metaDescription')}
    </label>

    <div className="admin-row admin-row--3">
      <label className="admin-field">Categoria<select value={campos.categoria} onChange={(event) => setCampos((atual) => ({ ...atual, categoria: event.target.value, subtema: '' }))}>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select>{erroDe('categoria')}</label>
      <label className="admin-field">Subtema<select value={campos.subtema} onChange={(event) => update('subtema', event.target.value)}><option value="">Nenhum</option>{subtemas.filter((item) => item.parentSlug === campos.categoria).map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select>{erroDe('subtema')}</label>
      <label className="admin-field">Data<input type="date" value={campos.data} onChange={(event) => update('data', event.target.value)} />{erroDe('data')}</label>
    </div>
    <div className="admin-row admin-row--3">
      <label className="admin-field">Etapa do funil<select value={campos.etapaFunil} onChange={(event) => update('etapaFunil', event.target.value)}>{etapasFunil.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><small className="admin-muted">{etapasFunil.find((item) => item.value === campos.etapaFunil)?.ajuda}</small></label>
      <label className="admin-field">Chamada no fim<select value={campos.ctaTipo} onChange={(event) => update('ctaTipo', event.target.value)}>{tiposCta.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label className="admin-field">Autor<input value={campos.autor} onChange={(event) => update('autor', event.target.value)} />{erroDe('autor')}</label>
    </div>
    <label className="admin-field">Palavras-chave (separadas por vírgula)
      <input value={campos.palavrasChave} placeholder="Ex.: custo de software, orçamento de TI" onChange={(event) => update('palavrasChave', event.target.value)} />
      {erroDe('palavrasChave')}
    </label>

    <div className="artigo-editor">
      <div className="artigo-editor-topo">
        <span>Texto do artigo (Markdown)</span>
        <button type="button" className="button-secondary" onClick={() => setPrevia((valor) => !valor)}>{previa ? <><PenLine size={14} /> Editar</> : <><Eye size={14} /> Prévia</>}</button>
      </div>
      {previa
        ? <div className="markdown artigo-previa"><ReactMarkdown>{campos.corpo || '_O texto aparece aqui._'}</ReactMarkdown></div>
        : <textarea className="artigo-corpo" rows={18} value={campos.corpo} placeholder={'## Primeira seção\n\nTexto do parágrafo, com [links](https://exemplo.com) para as fontes.'} onChange={(event) => update('corpo', event.target.value)} aria-label="Texto do artigo" aria-invalid={Boolean(erros.corpo) || undefined} />}
      <small className={faixa && (palavras < faixa[0] || palavras > faixa[1]) ? 'admin-contador fora' : 'admin-contador'}>{palavras} palavras{faixa ? ` (recomendado: ${faixa[0]} a ${faixa[1]})` : ''}</small>
      {erroDe('corpo')}
    </div>

    <label className="toggle-row admin-rascunho"><input type="checkbox" checked={campos.rascunho} onChange={(event) => update('rascunho', event.target.checked)} /> Salvar como rascunho (não aparece no site; dá para publicar depois pelo GitHub)</label>

    {erroGeral && <p className="form-error" role="alert">{erroGeral}</p>}
    <footer className="admin-actions">
      <button type="submit" className="button-primary" disabled={enviando}><Check size={16} /> {enviando ? 'Enviando…' : campos.rascunho ? 'Salvar rascunho' : 'Publicar artigo'}</button>
      <button type="button" className="button-secondary" onClick={onCancelar} disabled={enviando}><X size={15} /> Cancelar</button>
    </footer>
  </form>
}
