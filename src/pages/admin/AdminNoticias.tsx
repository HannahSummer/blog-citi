import { useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, Check, ExternalLink, Plus, RotateCcw, Save, X } from 'lucide-react'
import { PainelInterno } from '../../components/painel/PainelInterno'
import { limitesNoticia as limites } from '../../config/noticias'
import { categories } from '../../data/categorias'
import { subtemas } from '../../data/subtemas'
import { continentes } from '../../data/continentes'
import { formatarData } from '../../lib/datas'
import { NoticiaCard } from '../../components/noticias/NoticiaCard'
import { cadastrarNoticia, listarNoticias, salvarNoticia, type CamposEditaveis, type NoticiaPainel, type NovaNoticia, type StatusNoticia } from '../../services/noticias'

const abas: Array<{ status: StatusNoticia; label: string }> = [
  { status: 'pendente', label: 'Para revisar' },
  { status: 'aprovada', label: 'Publicadas' },
  { status: 'rejeitada', label: 'Rejeitadas' },
]

export function AdminNoticias() {
  return <PainelInterno titulo="Curadoria de" destaque="notícias."><Fila /></PainelInterno>
}

function Fila() {
  const [aba, setAba] = useState<StatusNoticia>('pendente')
  const [itens, setItens] = useState<NoticiaPainel[] | null>(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [cadastrando, setCadastrando] = useState(false)
  const [recarregar, setRecarregar] = useState(0)

  useEffect(() => {
    let ativo = true
    setItens(null)
    listarNoticias(aba).then((lista) => ativo && setItens(lista)).catch((e: Error) => ativo && setErro(e.message))
    return () => { ativo = false }
  }, [aba, recarregar])

  // Notícia cadastrada à mão já entra publicada: mostra a aba Publicadas com ela.
  const aoCadastrar = (noticia: NoticiaPainel) => {
    setCadastrando(false)
    setAviso(`"${noticia.titulo}" foi publicada.`)
    if (aba === 'aprovada') setRecarregar((valor) => valor + 1)
    else setAba('aprovada')
  }

  // Ao mudar o status, o card sai da aba atual.
  const aoMudar = (atualizada: NoticiaPainel, mensagem: string) => {
    setItens((lista) => (lista ?? []).flatMap((item) => item.id !== atualizada.id ? [item] : atualizada.status === aba ? [atualizada] : []))
    setAviso(mensagem)
  }

  return <div className="admin-fila">
    <div className="contatos-topo">
      <div className="admin-tabs" role="tablist">
        {abas.map((item) => <button type="button" role="tab" key={item.status} aria-selected={aba === item.status} className={aba === item.status ? 'active' : undefined} onClick={() => { setAba(item.status); setAviso('') }}>{item.label}</button>)}
      </div>
      {!cadastrando && <button type="button" className="button-primary" onClick={() => { setCadastrando(true); setAviso('') }}><Plus size={16} /> Cadastrar notícia</button>}
    </div>
    {cadastrando && <NovaNoticiaFormulario onCancelar={() => setCadastrando(false)} onCadastrada={aoCadastrar} />}
    <p className="admin-status" role="status">{aviso}</p>
    {erro && <p className="form-error" role="alert">{erro}</p>}
    {itens === null && !erro && <p className="admin-muted">Carregando…</p>}
    {itens?.length === 0 && <p className="admin-muted">{aba === 'pendente' ? 'Nada para revisar. As sugestões da semana chegam toda segunda de manhã.' : 'Nenhuma notícia aqui.'}</p>}
    {itens?.map((item) => <CartaoNoticia key={item.id} noticia={item} onMudar={aoMudar} />)}
  </div>
}

const vazia: NovaNoticia = { titulo: '', resumo: '', por_que_importa: '', categoria: categories[0].slug, subtema: null, continente: null, fonte: '', link: '', data_fonte: null }

// Cadastro manual, separado da curadoria semanal do radar: a notícia já entra publicada.
function NovaNoticiaFormulario({ onCancelar, onCadastrada }: { onCancelar: () => void; onCadastrada: (noticia: NoticiaPainel) => void }) {
  const [campos, setCampos] = useState<NovaNoticia>(vazia)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const update = <K extends keyof NovaNoticia>(campo: K, valor: NovaNoticia[K]) => setCampos((atual) => ({ ...atual, [campo]: valor }))
  const subtemasDaCategoria = subtemas.filter((item) => item.parentSlug === campos.categoria)

  // Mesmos limites da API e do banco (src/config/noticias.ts).
  const problemas = [
    ...(['titulo', 'resumo', 'por_que_importa'] as const).flatMap((campo) => {
      const tamanho = campos[campo].trim().length
      const [min, max] = limites[campo]
      return tamanho < min || tamanho > max ? [`${campo === 'por_que_importa' ? 'Por que importa' : campo === 'titulo' ? 'Título' : 'Resumo'}: entre ${min} e ${max} caracteres.`] : []
    }),
    ...(campos.fonte.trim().length < limites.fonte[0] ? ['Fonte: informe o nome do veículo.'] : []),
    ...(/^https?:\/\//.test(campos.link.trim()) ? [] : ['Link: use o endereço completo da matéria, com https://.']),
  ]

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    if (problemas.length) { setErro(problemas.join(' ')); return }
    setSalvando(true); setErro('')
    try {
      onCadastrada(await cadastrarNoticia({ ...campos, titulo: campos.titulo.trim(), resumo: campos.resumo.trim(), por_que_importa: campos.por_que_importa.trim(), fonte: campos.fonte.trim(), link: campos.link.trim() }))
    } catch (e) {
      setErro(`Não foi possível publicar: ${(e as Error).message}`)
    } finally {
      setSalvando(false)
    }
  }

  const categoriaLabel = categories.find((item) => item.slug === campos.categoria)?.label ?? ''
  return <form className="admin-card admin-nova" onSubmit={enviar} aria-labelledby="nova-noticia-titulo">
    <header className="admin-nova-topo">
      <h2 id="nova-noticia-titulo">Nova notícia</h2>
      <p className="admin-muted">Escreva com palavras próprias e informe a fonte. A notícia entra publicada; dá para tirar do ar depois na aba Publicadas.</p>
    </header>
    <div className="admin-card-grid">
      <div className="admin-form">
        <Campo id="nova-titulo" label="Título" valor={campos.titulo} limite={limites.titulo} onChange={(valor) => update('titulo', valor)} linhas={2} />
        <Campo id="nova-resumo" label="Resumo" valor={campos.resumo} limite={limites.resumo} onChange={(valor) => update('resumo', valor)} linhas={4} />
        <Campo id="nova-pqi" label="Por que importa" valor={campos.por_que_importa} limite={limites.por_que_importa} onChange={(valor) => update('por_que_importa', valor)} linhas={5} />
        <div className="admin-row">
          <label className="admin-field">Categoria<select value={campos.categoria} onChange={(event) => setCampos((atual) => ({ ...atual, categoria: event.target.value, subtema: null }))}>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select></label>
          <label className="admin-field">Subtema<select value={campos.subtema ?? ''} onChange={(event) => update('subtema', event.target.value || null)}><option value="">Nenhum</option>{subtemasDaCategoria.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select></label>
          <label className="admin-field">Continente<select value={campos.continente ?? ''} onChange={(event) => update('continente', event.target.value || null)}><option value="">Fora do globo</option>{continentes.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select></label>
        </div>
        <div className="admin-row">
          <label className="admin-field">Fonte (veículo)<input value={campos.fonte} placeholder="Ex.: Agência Brasil" onChange={(event) => update('fonte', event.target.value)} /></label>
          <label className="admin-field">Data da matéria<input type="date" value={campos.data_fonte ?? ''} onChange={(event) => update('data_fonte', event.target.value || null)} /></label>
        </div>
        <label className="admin-field">Link da matéria<input type="url" value={campos.link} placeholder="https://" onChange={(event) => update('link', event.target.value)} /></label>
      </div>
      <div className="admin-preview" aria-label="Prévia no site">
        <span className="admin-preview-label">Como fica no site</span>
        <NoticiaCard previa item={{ slug: 'nova', title: campos.titulo || 'Título da notícia', date: new Date().toISOString().slice(0, 10), category: categoriaLabel, categorySlug: campos.categoria, source: campos.fonte || 'Fonte', link: campos.link || 'https://exemplo.com', summary: campos.resumo || 'O resumo aparece aqui.', content: campos.por_que_importa || 'O "por que importa" aparece aqui.' }} />
      </div>
    </div>
    {erro && <p className="form-error" role="alert">{erro}</p>}
    <footer className="admin-actions">
      <button type="submit" className="button-primary" disabled={salvando}><Check size={16} /> {salvando ? 'Publicando…' : 'Publicar notícia'}</button>
      <button type="button" className="button-secondary" onClick={onCancelar} disabled={salvando}><X size={15} /> Cancelar</button>
    </footer>
  </form>
}

function CartaoNoticia({ noticia, onMudar }: { noticia: NoticiaPainel; onMudar: (n: NoticiaPainel, mensagem: string) => void }) {
  const [campos, setCampos] = useState<CamposEditaveis>({ titulo: noticia.titulo, resumo: noticia.resumo, por_que_importa: noticia.por_que_importa, categoria: noticia.categoria, subtema: noticia.subtema, continente: noticia.continente, link: noticia.link })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const alterado = (Object.keys(campos) as Array<keyof CamposEditaveis>).some((chave) => campos[chave] !== noticia[chave])
  const subtemasDaCategoria = subtemas.filter((item) => item.parentSlug === campos.categoria)
  const linkGoogle = campos.link.includes('news.google.com')
  const update = <K extends keyof CamposEditaveis>(campo: K, valor: CamposEditaveis[K]) => setCampos((atual) => ({ ...atual, [campo]: valor }))

  const problemas = [
    ...(['titulo', 'resumo', 'por_que_importa'] as const).flatMap((campo) => {
      const tamanho = campos[campo].trim().length
      const [min, max] = limites[campo]
      return tamanho < min || tamanho > max ? [`${campo === 'por_que_importa' ? 'Por que importa' : campo === 'titulo' ? 'Título' : 'Resumo'}: entre ${min} e ${max} caracteres.`] : []
    }),
    ...(/^https?:\/\//.test(campos.link) ? [] : ['Link: use o endereço completo, com https://.']),
  ]

  const enviar = async (status: StatusNoticia | undefined, mensagem: string) => {
    if (status !== 'rejeitada' && problemas.length) { setErro(problemas.join(' ')); return }
    setSalvando(true); setErro('')
    try {
      const limpos = { ...campos, titulo: campos.titulo.trim(), resumo: campos.resumo.trim(), por_que_importa: campos.por_que_importa.trim(), link: campos.link.trim() }
      onMudar(await salvarNoticia(noticia.id, status ? { ...limpos, status } : limpos), mensagem)
    } catch (e) {
      setErro(`Não foi possível salvar: ${(e as Error).message}`)
    } finally {
      setSalvando(false)
    }
  }

  const categoriaLabel = categories.find((item) => item.slug === campos.categoria)?.label ?? ''
  return <article className="admin-card" aria-labelledby={`titulo-${noticia.id}`}>
    <header className="admin-card-meta">
      <span>{noticia.fonte}</span>
      {noticia.data_fonte && <span>{formatarData(noticia.data_fonte.slice(0, 10))}</span>}
      {noticia.pontuacao !== null && <span>pontuação {noticia.pontuacao}</span>}
      <a href={noticia.link} target="_blank" rel="noopener noreferrer">Abrir matéria <ExternalLink size={13} /></a>
    </header>
    {noticia.motivo && <p className="admin-motivo"><strong>Por que o radar sugeriu:</strong> {noticia.motivo}</p>}
    <details className="admin-original"><summary>Ver título e trecho originais</summary><p><strong>{noticia.titulo_original}</strong></p>{noticia.trecho_feed && <p>{noticia.trecho_feed}</p>}<small>Compare para garantir que a copy não repete frases da fonte.</small></details>

    <div className="admin-card-grid">
      <div className="admin-form">
        <Campo id={`titulo-${noticia.id}`} label="Título" valor={campos.titulo} limite={limites.titulo} onChange={(valor) => update('titulo', valor)} linhas={2} />
        <Campo id={`resumo-${noticia.id}`} label="Resumo" valor={campos.resumo} limite={limites.resumo} onChange={(valor) => update('resumo', valor)} linhas={4} />
        <Campo id={`pqi-${noticia.id}`} label="Por que importa" valor={campos.por_que_importa} limite={limites.por_que_importa} onChange={(valor) => update('por_que_importa', valor)} linhas={6} />
        <div className="admin-row">
          <label className="admin-field">Categoria<select value={campos.categoria} onChange={(event) => setCampos((atual) => ({ ...atual, categoria: event.target.value, subtema: null }))}>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select></label>
          <label className="admin-field">Subtema<select value={campos.subtema ?? ''} onChange={(event) => update('subtema', event.target.value || null)}><option value="">Nenhum</option>{subtemasDaCategoria.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select></label>
          <label className="admin-field">Continente<select value={campos.continente ?? ''} onChange={(event) => update('continente', event.target.value || null)}><option value="">Fora do globo</option>{continentes.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select></label>
        </div>
        <label className="admin-field">Link da matéria<input type="url" value={campos.link} onChange={(event) => update('link', event.target.value)} />
          {linkGoogle && <small className="admin-alerta"><AlertTriangle size={13} /> Link do Google Notícias: abra a matéria e cole aqui o endereço final.</small>}
        </label>
      </div>

      <div className="admin-preview" aria-label="Prévia no site">
        <span className="admin-preview-label">Como fica no site</span>
        <NoticiaCard previa item={{ slug: noticia.id, title: campos.titulo, date: (noticia.publicado_em ?? new Date().toISOString()).slice(0, 10), category: categoriaLabel, categorySlug: campos.categoria, source: noticia.fonte, link: campos.link, summary: campos.resumo, content: campos.por_que_importa }} />
      </div>
    </div>

    {erro && <p className="form-error" role="alert">{erro}</p>}
    <footer className="admin-actions">
      {noticia.status === 'pendente' && <>
        <button type="button" className="button-primary" disabled={salvando} onClick={() => enviar('aprovada', 'Notícia aprovada e publicada.')}><Check size={16} /> Aprovar e publicar</button>
        <button type="button" className="button-secondary" disabled={salvando || !alterado} onClick={() => enviar(undefined, 'Alterações salvas.')}><Save size={15} /> Salvar edição</button>
        <button type="button" className="button-secondary admin-danger" disabled={salvando} onClick={() => enviar('rejeitada', 'Notícia rejeitada.')}><X size={15} /> Rejeitar</button>
      </>}
      {noticia.status === 'aprovada' && <>
        <button type="button" className="button-primary" disabled={salvando || !alterado} onClick={() => enviar(undefined, 'Notícia publicada atualizada.')}><Save size={15} /> Salvar edição</button>
        <button type="button" className="button-secondary admin-danger" disabled={salvando} onClick={() => enviar('pendente', 'Notícia tirada do ar e devolvida para revisão.')}><RotateCcw size={15} /> Tirar do ar</button>
      </>}
      {noticia.status === 'rejeitada' && <button type="button" className="button-secondary" disabled={salvando} onClick={() => enviar('pendente', 'Notícia devolvida para revisão.')}><RotateCcw size={15} /> Voltar para revisão</button>}
    </footer>
  </article>
}

function Campo({ id, label, valor, limite, onChange, linhas }: { id: string; label: string; valor: string; limite: readonly [number, number]; onChange: (valor: string) => void; linhas: number }) {
  const tamanho = valor.trim().length
  const fora = tamanho < limite[0] || tamanho > limite[1]
  return <label className="admin-field" htmlFor={id}>{label}
    <textarea id={id} rows={linhas} value={valor} onChange={(event) => onChange(event.target.value)} aria-invalid={fora || undefined} />
    <small className={fora ? 'admin-contador fora' : 'admin-contador'}>{tamanho} / {limite[1]}</small>
  </label>
}
