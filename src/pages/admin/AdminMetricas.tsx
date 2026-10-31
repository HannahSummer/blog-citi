import { useEffect, useRef, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { PainelInterno } from '../../components/painel/PainelInterno'
import { buscarMetricas, type ResumoMetricas } from '../../services/metricas'

const PERIODOS = [7, 30, 90] as const
const numero = (valor: number) => valor.toLocaleString('pt-BR')
const diaCurto = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
const diaLongo = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' })
const NOMES_ORIGEM: Record<string, string> = { direto: 'Acesso direto (link salvo, digitado ou app)', 'instagram.com': 'Instagram', 'l.instagram.com': 'Instagram', 'linkedin.com': 'LinkedIn', 'lnkd.in': 'LinkedIn', 'google.com': 'Google', 'google.com.br': 'Google', 'facebook.com': 'Facebook', 'm.facebook.com': 'Facebook', 't.co': 'X (Twitter)', 'web.whatsapp.com': 'WhatsApp Web' }
const NOMES_APARELHO: Record<string, string> = { celular: 'Celular', computador: 'Computador', tablet: 'Tablet' }

export function AdminMetricas() {
  return <PainelInterno titulo="Métricas de" destaque="acesso."><Metricas /></PainelInterno>
}

function Metricas() {
  const [dias, setDias] = useState<(typeof PERIODOS)[number]>(30)
  const [resumo, setResumo] = useState<ResumoMetricas | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    setResumo(null)
    buscarMetricas(dias).then((dados) => ativo && setResumo(dados)).catch((e: Error) => ativo && setErro(e.message))
    return () => { ativo = false }
  }, [dias])

  const paginasPorVisita = resumo && resumo.visitas ? (resumo.visualizacoes / resumo.visitas).toFixed(1).replace('.', ',') : '–'

  return <div className="admin-fila metricas">
    <div className="contatos-topo">
      <div className="admin-tabs" role="group" aria-label="Período">
        {PERIODOS.map((periodo) => <button type="button" key={periodo} aria-pressed={dias === periodo} className={dias === periodo ? 'active' : undefined} onClick={() => setDias(periodo)}>Últimos {periodo} dias</button>)}
      </div>
    </div>
    {erro && <p className="form-error" role="alert">{erro}</p>}
    {!resumo && !erro && <p className="admin-muted">Carregando…</p>}

    {resumo && <>
      <dl className="metricas-numeros">
        <div><dt>Visitantes</dt><dd>{numero(resumo.visitantes)}</dd><small>pessoas diferentes por dia, somadas</small></div>
        <div><dt>Visitas</dt><dd>{numero(resumo.visitas)}</dd><small>vezes que alguém entrou no blog</small></div>
        <div><dt>Páginas vistas</dt><dd>{numero(resumo.visualizacoes)}</dd><small>todas as páginas abertas</small></div>
        <div><dt>Páginas por visita</dt><dd>{paginasPorVisita}</dd><small>quanto cada visita explora</small></div>
      </dl>

      {resumo.visualizacoes === 0
        ? <p className="admin-aviso">Ainda não há acessos registrados neste período. Os números aparecem assim que alguém abrir o blog publicado.</p>
        : <>
          <GraficoPorDia porDia={resumo.porDia} />
          <div className="metricas-listas">
            <ListaDeBarras titulo="Páginas mais vistas" itens={resumo.paginas.map((item) => ({ rotulo: item.caminho, total: item.total }))} />
            <ListaDeBarras titulo="De onde vieram" ajuda="Site ou rede de onde a pessoa clicou para entrar no blog." itens={resumo.origens.map((item) => ({ rotulo: NOMES_ORIGEM[item.origem] ?? item.origem, total: item.total }))} />
            <ListaDeBarras titulo="Campanhas (links com utm)" ajuda="Links divulgados com ?utm_source=...&utm_campaign=... no endereço." vazio="Nenhuma visita veio de link de campanha." itens={resumo.campanhas.map((item) => ({ rotulo: [item.source, item.campaign].filter(Boolean).join(' · '), total: item.total }))} />
            <ListaDeBarras titulo="Aparelhos" itens={resumo.dispositivos.map((item) => ({ rotulo: NOMES_APARELHO[item.dispositivo] ?? item.dispositivo, total: item.total }))} />
          </div>
        </>}

      <p className="metricas-privacidade"><ShieldCheck size={16} aria-hidden="true" /> Contagem anônima: o blog não usa cookies, não guarda IP e não identifica quem visitou. Quem quer ser contatado aparece em Contatos, pelo diagnóstico ou pela newsletter.</p>
    </>}
  </div>
}

// Colunas de visitantes por dia: uma série só (o título nomeia a série), legenda do valor ao passar o mouse e tabela para quem prefere ler.
function GraficoPorDia({ porDia }: { porDia: ResumoMetricas['porDia'] }) {
  const caixa = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(0)
  const [ativo, setAtivo] = useState<number | null>(null)

  useEffect(() => {
    const elemento = caixa.current
    if (!elemento) return
    const observador = new ResizeObserver(([entrada]) => setLargura(entrada.contentRect.width))
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  const altura = 220
  const margem = { topo: 12, base: 26, esquerda: 34, direita: 4 }
  const maximo = Math.max(1, ...porDia.map((dia) => dia.visitantes))
  // Teto "redondo" para as linhas de grade ficarem em números inteiros.
  const teto = maximo <= 4 ? 4 : Math.ceil(maximo / 4) * 4
  const larguraUtil = Math.max(0, largura - margem.esquerda - margem.direita)
  const passo = porDia.length ? larguraUtil / porDia.length : 0
  const barra = Math.max(2, Math.min(28, passo - 2))
  const alturaUtil = altura - margem.topo - margem.base
  const y = (valor: number) => margem.topo + alturaUtil - (valor / teto) * alturaUtil
  const grades = [0, teto / 2, teto]
  // Datas no eixo: só algumas, para não se sobreporem.
  const rotulos = new Set([0, Math.floor((porDia.length - 1) / 2), porDia.length - 1])
  const dica = ativo !== null ? porDia[ativo] : null

  return <section className="admin-card metricas-grafico" aria-labelledby="titulo-grafico">
    <h2 id="titulo-grafico" className="metricas-titulo">Visitantes por dia</h2>
    <div className="metricas-grafico-area" ref={caixa} onMouseLeave={() => setAtivo(null)}>
      {largura > 0 && <svg width={largura} height={altura} role="img" aria-label={`Visitantes por dia nos últimos ${porDia.length} dias. A tabela abaixo traz os números.`}>
        {grades.map((valor) => <g key={valor}>
          <line x1={margem.esquerda} x2={largura - margem.direita} y1={y(valor)} y2={y(valor)} className="metricas-grade" />
          <text x={margem.esquerda - 8} y={y(valor) + 4} className="metricas-eixo" textAnchor="end">{numero(valor)}</text>
        </g>)}
        {porDia.map((dia, indice) => {
          const x = margem.esquerda + indice * passo + (passo - barra) / 2
          const topo = y(dia.visitantes)
          const h = Math.max(0, margem.topo + alturaUtil - topo)
          const r = Math.min(4, barra / 2, h)
          return <g key={dia.dia}>
            {/* Coluna com a ponta de cima arredondada e a base reta, apoiada no eixo. */}
            {h > 0 && <path className={ativo === indice ? 'metricas-barra ativa' : 'metricas-barra'} d={`M${x},${topo + h} V${topo + r} Q${x},${topo} ${x + r},${topo} H${x + barra - r} Q${x + barra},${topo} ${x + barra},${topo + r} V${topo + h} Z`} />}
            {rotulos.has(indice) && <text x={x + barra / 2} y={altura - 6} className="metricas-eixo" textAnchor="middle">{diaCurto(dia.dia)}</text>}
            {/* Área de toque maior que a coluna, do topo à base. */}
            <rect x={margem.esquerda + indice * passo} y={margem.topo} width={passo} height={alturaUtil} fill="transparent" onMouseEnter={() => setAtivo(indice)} onFocus={() => setAtivo(indice)} onBlur={() => setAtivo(null)} tabIndex={0} aria-label={`${diaLongo(dia.dia)}: ${dia.visitantes} visitantes, ${dia.visualizacoes} páginas vistas`} />
          </g>
        })}
      </svg>}
      {dica && ativo !== null && <div className="metricas-dica" style={{ left: Math.min(Math.max(margem.esquerda + ativo * passo + passo / 2, 80), largura - 80) }} role="status">
        <strong>{diaLongo(dica.dia)}</strong>
        <span><b>{numero(dica.visitantes)}</b> visitantes</span>
        <span><b>{numero(dica.visualizacoes)}</b> páginas vistas</span>
      </div>}
    </div>
    <details className="metricas-tabela">
      <summary>Ver os números em tabela</summary>
      <table>
        <thead><tr><th scope="col">Dia</th><th scope="col">Visitantes</th><th scope="col">Páginas vistas</th></tr></thead>
        <tbody>{[...porDia].reverse().map((dia) => <tr key={dia.dia}><td>{diaLongo(dia.dia)}</td><td>{numero(dia.visitantes)}</td><td>{numero(dia.visualizacoes)}</td></tr>)}</tbody>
      </table>
    </details>
  </section>
}

// Ranking com barras horizontais: o número fica em texto, a barra só ajuda a comparar.
function ListaDeBarras({ titulo, ajuda, vazio = 'Sem dados no período.', itens }: { titulo: string; ajuda?: string; vazio?: string; itens: Array<{ rotulo: string; total: number }> }) {
  const maximo = Math.max(1, ...itens.map((item) => item.total))
  return <section className="admin-card metricas-lista">
    <h2 className="metricas-titulo">{titulo}</h2>
    {ajuda && <p className="admin-muted metricas-ajuda">{ajuda}</p>}
    {itens.length === 0 ? <p className="admin-muted">{vazio}</p> : <ol>
      {itens.map((item) => <li key={item.rotulo}>
        <div className="metricas-lista-linha"><span title={item.rotulo}>{item.rotulo}</span><b>{numero(item.total)}</b></div>
        <span className="metricas-lista-barra" style={{ width: `${(item.total / maximo) * 100}%` }} aria-hidden="true" />
      </li>)}
    </ol>}
  </section>
}
