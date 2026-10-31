import { useEffect, useMemo, useState, type DragEvent } from 'react'
import { ChevronDown, Download, GripVertical, Mail, MessageCircle, Search } from 'lucide-react'
import { PainelInterno } from '../../components/painel/PainelInterno'
import { buscarNivel, comoConheceuOpcoes, type NivelId } from '../../config/diagnostico'
import { baixarCsv } from '../../lib/csv'
import { atualizarStatusLead, listarLeads, listarNewsletter, statusLead, type InscricaoNewsletter, type Lead, type StatusLead } from '../../services/leads'

const dataHora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const dataCurta = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
const comoConheceu = (valor: string) => comoConheceuOpcoes.find((opcao) => opcao.value === valor)?.label ?? valor
const rotuloStatus = (status: StatusLead) => statusLead.find((item) => item.value === status)?.label ?? status
const nivelDo = (lead: Lead) => buscarNivel(lead.nivel as NivelId).label

// Uma pessoa que chegou pelo blog: pelo diagnóstico (vira lead, com etapa) ou só pela newsletter.
interface Pessoa { chave: string; data: string; email: string; lead?: Lead; newsletter: boolean; origemNewsletter?: string | null }

type Visao = 'pessoas' | 'kanban'
type FiltroOrigem = 'todas' | 'diagnostico' | 'newsletter'

export function AdminLeads() {
  return <PainelInterno titulo="Contatos e" destaque="acompanhamento."><Contatos /></PainelInterno>
}

function Contatos() {
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [inscritos, setInscritos] = useState<InscricaoNewsletter[]>([])
  const [visao, setVisao] = useState<Visao>('pessoas')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    Promise.all([listarLeads(), listarNewsletter()])
      .then(([listaLeads, listaNewsletter]) => { setLeads(listaLeads); setInscritos(listaNewsletter) })
      .catch((e: Error) => setErro(e.message))
  }, [])

  // Muda a etapa na hora (o card já pula de coluna) e desfaz se a API recusar.
  const mudarStatus = async (lead: Lead, status: StatusLead) => {
    if (lead.status === status) return
    setLeads((lista) => (lista ?? []).map((item) => (item.id === lead.id ? { ...item, status } : item)))
    try {
      await atualizarStatusLead(lead.id, status)
      setAviso(`${lead.nome}: ${rotuloStatus(status)}.`)
    } catch (e) {
      setLeads((lista) => (lista ?? []).map((item) => (item.id === lead.id ? lead : item)))
      setErro(`Não foi possível salvar: ${(e as Error).message}`)
    }
  }

  // Todo mundo numa lista só: quem fez o diagnóstico (com ou sem newsletter) e quem só assinou a newsletter.
  const pessoas = useMemo<Pessoa[]>(() => {
    const emailsDeLeads = new Set((leads ?? []).map((lead) => lead.email))
    const deLeads = (leads ?? []).map((lead) => ({ chave: lead.id, data: lead.created_at, email: lead.email, lead, newsletter: lead.newsletter_optin }))
    const soNewsletter = inscritos.filter((item) => !emailsDeLeads.has(item.email)).map((item) => ({ chave: `n-${item.email}`, data: item.created_at, email: item.email, newsletter: true, origemNewsletter: item.origem }))
    return [...deLeads, ...soNewsletter].sort((a, b) => b.data.localeCompare(a.data))
  }, [leads, inscritos])

  const exportarLeads = () => baixarCsv(`leads-citi-${new Date().toISOString().slice(0, 10)}.csv`, (leads ?? []).map((lead) => ({
    data: dataHora(lead.created_at), etapa: rotuloStatus(lead.status), nome: lead.nome, email: lead.email, telefone: lead.telefone, empresa: lead.empresa, cargo: lead.cargo,
    nivel: nivelDo(lead), pontuacao: lead.pontuacao, problema: lead.problema, como_conheceu: comoConheceu(lead.como_conheceu),
    newsletter: lead.newsletter_optin ? 'sim' : 'não', origem: lead.origem, utm_source: lead.utm_source, utm_medium: lead.utm_medium, utm_campaign: lead.utm_campaign,
  })))
  const exportarNewsletter = () => {
    if (!inscritos.length) { setAviso('Nenhuma inscrição na newsletter ainda.'); return }
    baixarCsv(`newsletter-citi-${new Date().toISOString().slice(0, 10)}.csv`, inscritos.map((item) => ({ email: item.email, origem: item.origem, data: dataHora(item.created_at) })))
  }

  return <div className="admin-fila">
    <div className="contatos-topo">
      <div className="admin-tabs" role="tablist" aria-label="Visão dos contatos">
        <button type="button" role="tab" aria-selected={visao === 'pessoas'} className={visao === 'pessoas' ? 'active' : undefined} onClick={() => setVisao('pessoas')}>Pessoas <b>{pessoas.length}</b></button>
        <button type="button" role="tab" aria-selected={visao === 'kanban'} className={visao === 'kanban' ? 'active' : undefined} onClick={() => setVisao('kanban')}>Acompanhamento <b>{leads?.length ?? 0}</b></button>
      </div>
      <div className="admin-leads-exportar">
        <button type="button" className="button-secondary" onClick={exportarLeads} disabled={!leads?.length}><Download size={15} /> Leads (CSV)</button>
        <button type="button" className="button-secondary" onClick={exportarNewsletter}><Download size={15} /> Newsletter (CSV)</button>
      </div>
    </div>
    <p className="admin-status" role="status">{aviso}</p>
    {erro && <p className="form-error" role="alert">{erro}</p>}
    {leads === null && !erro && <p className="admin-muted">Carregando…</p>}
    {leads !== null && visao === 'pessoas' && <ListaDePessoas pessoas={pessoas} aoMudarStatus={mudarStatus} />}
    {leads !== null && visao === 'kanban' && <Kanban leads={leads} aoMudarStatus={mudarStatus} />}
  </div>
}

function ListaDePessoas({ pessoas, aoMudarStatus }: { pessoas: Pessoa[]; aoMudarStatus: (lead: Lead, status: StatusLead) => void }) {
  const [busca, setBusca] = useState('')
  const [origem, setOrigem] = useState<FiltroOrigem>('todas')
  const [aberta, setAberta] = useState<string | null>(null)

  const termo = busca.trim().toLowerCase()
  const visiveis = pessoas.filter((pessoa) => {
    if (origem === 'diagnostico' && !pessoa.lead) return false
    if (origem === 'newsletter' && pessoa.lead) return false
    if (!termo) return true
    return [pessoa.email, pessoa.lead?.nome, pessoa.lead?.empresa].some((campo) => campo?.toLowerCase().includes(termo))
  })
  const total = (filtro: FiltroOrigem) => pessoas.filter((pessoa) => filtro === 'todas' || (filtro === 'diagnostico' ? pessoa.lead : !pessoa.lead)).length

  return <>
    <div className="pessoas-filtros">
      <label className="pessoas-busca"><Search size={16} aria-hidden="true" /><span className="sr-only">Buscar</span>
        <input type="search" placeholder="Buscar por nome, e-mail ou empresa" value={busca} onChange={(event) => setBusca(event.target.value)} />
      </label>
      <div className="admin-tabs" role="group" aria-label="Como a pessoa chegou">
        {([['todas', 'Todas'], ['diagnostico', 'Diagnóstico'], ['newsletter', 'Só newsletter']] as const).map(([valor, rotulo]) =>
          <button type="button" key={valor} aria-pressed={origem === valor} className={origem === valor ? 'active' : undefined} onClick={() => setOrigem(valor)}>{rotulo} <b>{total(valor)}</b></button>)}
      </div>
    </div>

    {visiveis.length === 0 && <p className="admin-muted">{pessoas.length ? 'Ninguém com esse filtro.' : 'Ainda não chegou ninguém pelo blog.'}</p>}
    <ul className="pessoas">
      {visiveis.map((pessoa) => {
        const lead = pessoa.lead
        const expandida = aberta === pessoa.chave
        return <li className={expandida ? 'pessoa aberta' : 'pessoa'} key={pessoa.chave}>
          <button type="button" className="pessoa-linha" aria-expanded={expandida} onClick={() => setAberta(expandida ? null : pessoa.chave)}>
            <span className="pessoa-nome"><strong>{lead?.nome ?? pessoa.email}</strong><small>{lead ? `${lead.cargo} · ${lead.empresa}` : 'Inscrita na newsletter'}</small></span>
            <span className="pessoa-selos">
              <span className={lead ? 'selo selo--diagnostico' : 'selo'}>{lead ? 'Diagnóstico' : 'Newsletter'}</span>
              {lead && <span className={`selo selo--${lead.status}`}>{rotuloStatus(lead.status)}</span>}
            </span>
            <span className="pessoa-data">{dataCurta(pessoa.data)}</span>
            <ChevronDown size={16} className="pessoa-seta" aria-hidden="true" />
          </button>
          {expandida && <div className="pessoa-detalhes">
            <div className="admin-lead-contato">
              <a href={`mailto:${pessoa.email}`}><Mail size={14} /> {pessoa.email}</a>
              {lead && <a href={`https://wa.me/55${lead.telefone}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> {lead.telefone}</a>}
            </div>
            {lead ? <>
              <dl className="pessoa-dados">
                <div><dt>Chegou em</dt><dd>{dataHora(lead.created_at)}</dd></div>
                <div><dt>Resultado do diagnóstico</dt><dd>{nivelDo(lead)} · {lead.pontuacao}/12</dd></div>
                <div><dt>Como conheceu</dt><dd>{comoConheceu(lead.como_conheceu)}{lead.utm_source ? ` · campanha ${lead.utm_source}${lead.utm_campaign ? ` / ${lead.utm_campaign}` : ''}` : ''}</dd></div>
                <div><dt>Newsletter</dt><dd>{lead.newsletter_optin ? 'Quer receber' : 'Não quis'}</dd></div>
              </dl>
              {lead.problema && <p className="admin-motivo"><strong>Problema:</strong> {lead.problema}</p>}
              <label className="admin-field pessoa-etapa">Etapa do acompanhamento
                <select value={lead.status} onChange={(event) => aoMudarStatus(lead, event.target.value as StatusLead)}>{statusLead.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
              </label>
            </> : <p className="admin-muted">Assinou a newsletter em {dataHora(pessoa.data)}{pessoa.origemNewsletter ? ` (origem: ${pessoa.origemNewsletter})` : ''}. Não fez o diagnóstico.</p>}
          </div>}
        </li>
      })}
    </ul>
  </>
}

// Kanban: uma coluna por etapa. Arrastar o card muda a etapa; o seletor no card faz o mesmo pelo teclado e no celular.
function Kanban({ leads, aoMudarStatus }: { leads: Lead[]; aoMudarStatus: (lead: Lead, status: StatusLead) => void }) {
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [sobre, setSobre] = useState<StatusLead | null>(null)

  const soltar = (event: DragEvent, status: StatusLead) => {
    event.preventDefault()
    const lead = leads.find((item) => item.id === event.dataTransfer.getData('text/plain'))
    setSobre(null)
    setArrastando(null)
    if (lead) aoMudarStatus(lead, status)
  }

  if (!leads.length) return <p className="admin-muted">Nenhum lead ainda. Os leads chegam pelo formulário do diagnóstico.</p>

  return <div className="kanban">
    {statusLead.map((coluna) => {
      const cards = leads.filter((lead) => lead.status === coluna.value)
      return <section key={coluna.value} className={sobre === coluna.value ? `kanban-coluna kanban-coluna--${coluna.value} sobre` : `kanban-coluna kanban-coluna--${coluna.value}`} aria-label={`${coluna.label}: ${cards.length}`}
        onDragOver={(event) => { event.preventDefault(); setSobre(coluna.value) }}
        onDragLeave={() => setSobre((atual) => (atual === coluna.value ? null : atual))}
        onDrop={(event) => soltar(event, coluna.value)}>
        <h2 className="kanban-titulo">{coluna.label} <b>{cards.length}</b></h2>
        <div className="kanban-cards">
          {cards.length === 0 && <p className="kanban-vazio">Arraste um card para cá</p>}
          {cards.map((lead) => <article key={lead.id} className={arrastando === lead.id ? 'kanban-card arrastando' : 'kanban-card'} draggable
            onDragStart={(event) => { event.dataTransfer.setData('text/plain', lead.id); event.dataTransfer.effectAllowed = 'move'; setArrastando(lead.id) }}
            onDragEnd={() => { setArrastando(null); setSobre(null) }}>
            <div className="kanban-card-topo"><GripVertical size={14} aria-hidden="true" /><strong>{lead.nome}</strong></div>
            <p>{lead.empresa}</p>
            <p className="kanban-card-meta">{nivelDo(lead)} · {lead.pontuacao}/12 · {dataCurta(lead.created_at)}</p>
            <div className="admin-lead-contato">
              <a href={`mailto:${lead.email}`} aria-label={`E-mail para ${lead.nome}`}><Mail size={14} /></a>
              <a href={`https://wa.me/55${lead.telefone}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp de ${lead.nome}`}><MessageCircle size={14} /></a>
            </div>
            <label className="kanban-mover"><span className="sr-only">Etapa de {lead.nome}</span>
              <select value={lead.status} onChange={(event) => aoMudarStatus(lead, event.target.value as StatusLead)}>{statusLead.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            </label>
          </article>)}
        </div>
      </section>
    })}
  </div>
}
