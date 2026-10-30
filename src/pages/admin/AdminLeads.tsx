import { useEffect, useState } from 'react'
import { Download, Mail, MessageCircle } from 'lucide-react'
import { PainelInterno } from '../../components/painel/PainelInterno'
import { buscarNivel, comoConheceuOpcoes, type NivelId } from '../../config/diagnostico'
import { baixarCsv } from '../../lib/csv'
import { atualizarStatusLead, listarLeads, listarNewsletter, statusLead, type Lead, type StatusLead } from '../../services/leads'

const filtros: Array<{ value: StatusLead | 'todos'; label: string }> = [{ value: 'todos', label: 'Todos' }, ...statusLead]
const dataHora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const comoConheceu = (valor: string) => comoConheceuOpcoes.find((opcao) => opcao.value === valor)?.label ?? valor

export function AdminLeads() {
  return <PainelInterno titulo="Leads e" destaque="newsletter."><Leads /></PainelInterno>
}

function Leads() {
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [filtro, setFiltro] = useState<StatusLead | 'todos'>('novo')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  useEffect(() => { listarLeads().then(setLeads).catch((e: Error) => setErro(e.message)) }, [])

  const mudarStatus = async (lead: Lead, status: StatusLead) => {
    try {
      const atualizado = await atualizarStatusLead(lead.id, status)
      setLeads((lista) => (lista ?? []).map((item) => (item.id === atualizado.id ? atualizado : item)))
      setAviso(`${lead.nome}: ${statusLead.find((s) => s.value === status)?.label}.`)
    } catch (e) {
      setErro(`Não foi possível salvar: ${(e as Error).message}`)
    }
  }

  const exportarLeads = () => baixarCsv(`leads-citi-${new Date().toISOString().slice(0, 10)}.csv`, (leads ?? []).map((lead) => ({
    data: dataHora(lead.created_at), status: lead.status, nome: lead.nome, email: lead.email, telefone: lead.telefone, empresa: lead.empresa, cargo: lead.cargo,
    nivel: buscarNivel(lead.nivel as NivelId).label, pontuacao: lead.pontuacao, problema: lead.problema, como_conheceu: comoConheceu(lead.como_conheceu),
    newsletter: lead.newsletter_optin ? 'sim' : 'não', origem: lead.origem, utm_source: lead.utm_source, utm_medium: lead.utm_medium, utm_campaign: lead.utm_campaign,
  })))

  const exportarNewsletter = async () => {
    try {
      const lista = await listarNewsletter()
      if (!lista.length) { setAviso('Nenhuma inscrição na newsletter ainda.'); return }
      baixarCsv(`newsletter-citi-${new Date().toISOString().slice(0, 10)}.csv`, lista.map((item) => ({ email: item.email, origem: item.origem, data: dataHora(item.created_at) })))
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  const visiveis = (leads ?? []).filter((lead) => filtro === 'todos' || lead.status === filtro)
  const contagem = (valor: StatusLead | 'todos') => (leads ?? []).filter((lead) => valor === 'todos' || lead.status === valor).length

  return <div className="admin-fila">
    <div className="admin-leads-topo">
      <div className="admin-tabs" role="tablist">
        {filtros.map((item) => <button type="button" role="tab" key={item.value} aria-selected={filtro === item.value} className={filtro === item.value ? 'active' : undefined} onClick={() => { setFiltro(item.value); setAviso('') }}>{item.label} <b>{contagem(item.value)}</b></button>)}
      </div>
      <div className="admin-leads-exportar">
        <button type="button" className="button-secondary" onClick={exportarLeads} disabled={!leads?.length}><Download size={15} /> Leads (CSV)</button>
        <button type="button" className="button-secondary" onClick={exportarNewsletter}><Download size={15} /> Newsletter (CSV)</button>
      </div>
    </div>
    <p className="admin-status" role="status">{aviso}</p>
    {erro && <p className="form-error" role="alert">{erro}</p>}
    {leads === null && !erro && <p className="admin-muted">Carregando…</p>}
    {leads !== null && visiveis.length === 0 && <p className="admin-muted">Nenhum lead {filtro === 'todos' ? 'ainda' : 'com esse status'}.</p>}
    {visiveis.map((lead) => <article className="admin-card admin-lead" key={lead.id}>
      <header className="admin-card-meta">
        <span>{dataHora(lead.created_at)}</span>
        <span>{buscarNivel(lead.nivel as NivelId).label} · {lead.pontuacao}/12</span>
        <span>Veio por: {comoConheceu(lead.como_conheceu)}{lead.utm_source ? ` · ${lead.utm_source}` : ''}</span>
        {lead.newsletter_optin && <span>Quer a newsletter</span>}
      </header>
      <div className="admin-lead-corpo">
        <div>
          <h2>{lead.nome}</h2>
          <p className="admin-muted">{lead.cargo} · {lead.empresa}</p>
          <div className="admin-lead-contato">
            <a href={`mailto:${lead.email}`}><Mail size={14} /> {lead.email}</a>
            <a href={`https://wa.me/55${lead.telefone}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> {lead.telefone}</a>
          </div>
        </div>
        <label className="admin-field">Status
          <select value={lead.status} onChange={(event) => mudarStatus(lead, event.target.value as StatusLead)}>{statusLead.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        </label>
      </div>
      {lead.problema && <p className="admin-motivo"><strong>Problema:</strong> {lead.problema}</p>}
    </article>)}
  </div>
}
