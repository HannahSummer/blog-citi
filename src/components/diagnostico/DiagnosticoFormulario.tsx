import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buscarNivel, calcularResultado, comoConheceuOpcoes, diagnosticoTextos, politicaPrivacidadeUrl, type Respostas } from '../../config/diagnostico'
import { emailPessoal, limites, ordemCampos, somenteDigitos, validarCampos, type CampoDiagnostico, type DiagnosticoCampos, type ErrosDiagnostico } from '../../lib/diagnostico-schema'
import { submitDiagnostico } from '../../services/leads'
import type { UtmParams } from '../../hooks/useUtm'

const camposIniciais: DiagnosticoCampos = { nome: '', email: '', empresa: '', cargo: '', telefone: '', como_conheceu: '', problema: '', consentimento_contato: false, newsletter_optin: false }
const TEMPO_MINIMO_MS = 3000

// (00) 0000-0000, (00) 00000-0000 ou, com DDI, +00 (00) 00000-0000.
function mascararTelefone(valor: string): string {
  const digitos = somenteDigitos(valor).slice(0, limites.telefone.max)
  if (digitos.length > 11) return `+${digitos.slice(0, digitos.length - 11)} ${mascararTelefone(digitos.slice(-11))}`
  if (digitos.length <= 2) return digitos ? `(${digitos}` : ''
  const ddd = digitos.slice(0, 2)
  const numero = digitos.slice(2)
  const corte = numero.length > 8 ? 5 : 4
  return numero.length > corte ? `(${ddd}) ${numero.slice(0, corte)}-${numero.slice(corte)}` : `(${ddd}) ${numero}`
}

function Bloco({ numero, titulo, children }: { numero: string; titulo: string; children: ReactNode }) {
  return <div className="form-block"><div className="form-block-head"><span>{numero}</span><h3>{titulo}</h3></div><div className="form-block-body">{children}</div></div>
}

interface DiagnosticoFormularioProps {
  respostas: Respostas
  origem: string
  utm: UtmParams
  abertoEm: number
  onVoltar: () => void
}

export function DiagnosticoFormulario({ respostas, origem, utm, abertoEm, onVoltar }: DiagnosticoFormularioProps) {
  const [form, setForm] = useState(camposIniciais)
  const [website, setWebsite] = useState('')
  const [erros, setErros] = useState<ErrosDiagnostico>({})
  const [tentou, setTentou] = useState(false)
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'erro' | 'sucesso'>('idle')
  const [mensagemErro, setMensagemErro] = useState('')
  const nivel = buscarNivel(calcularResultado(respostas).nivel)
  const tituloRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => { tituloRef.current?.focus({ preventScroll: true }) }, [estado === 'sucesso'])

  function update<K extends CampoDiagnostico>(key: K, value: DiagnosticoCampos[K]) {
    const next = { ...form, [key]: value }
    setForm(next)
    if (tentou) setErros(validarCampos(next))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (estado === 'enviando') return
    // Honeypot preenchido ou envio rápido demais: finge sucesso e não grava nada.
    if (website || Date.now() - abertoEm < TEMPO_MINIMO_MS) { setEstado('sucesso'); return }
    setTentou(true)
    const next = validarCampos(form)
    setErros(next)
    const primeiro = ordemCampos.find((campo) => next[campo])
    if (primeiro) { document.getElementById(`diag-${primeiro}`)?.focus(); return }
    setEstado('enviando')
    const resultado = await submitDiagnostico({ ...form, respostas, origem, pagina_referencia: document.referrer || undefined, utm })
    if (resultado.ok) { setEstado('sucesso'); return }
    setMensagemErro(resultado.erro)
    setEstado('erro')
  }

  if (estado === 'sucesso') {
    return <div className="diagnostic-success" role="status">
      <svg className="success-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-16" /></svg>
      <h2 ref={tituloRef} tabIndex={-1}>{diagnosticoTextos.confirmacaoTitulo}</h2>
      <p>Seu nível no diagnóstico: <strong>{nivel.label}</strong>.</p>
      <p>{diagnosticoTextos.confirmacaoTexto}</p>
      <Link className="button-primary" to="/blog/artigos">{diagnosticoTextos.confirmacaoLink} <ArrowRight size={16} /></Link>
    </div>
  }

  const ariaCampo = (campo: CampoDiagnostico, ...extras: Array<string | false>) => {
    const ids = [erros[campo] && `diag-${campo}-erro`, ...extras].filter(Boolean).join(' ')
    return { id: `diag-${campo}`, 'aria-invalid': erros[campo] ? true : undefined, 'aria-describedby': ids || undefined }
  }
  const erro = (campo: CampoDiagnostico) => erros[campo] && <small className="form-error" id={`diag-${campo}-erro`}>{erros[campo]}</small>
  const obrigatorio = <span className="field-required" aria-hidden="true">*</span>
  const campoTexto = (campo: 'nome' | 'email' | 'empresa' | 'cargo' | 'telefone', label: string, props: { type?: string; autoComplete: string; maxLength?: number; inputMode?: 'numeric'; placeholder?: string }, extra?: ReactNode, extraId?: string | false) =>
    <label className="field" htmlFor={`diag-${campo}`}><span className="field-label">{label} {obrigatorio}</span>
      <input {...ariaCampo(campo, extraId ?? false)} type={props.type ?? 'text'} name={campo} autoComplete={props.autoComplete} maxLength={props.maxLength} inputMode={props.inputMode} placeholder={props.placeholder} required value={form[campo]} onChange={(event) => update(campo, campo === 'telefone' ? mascararTelefone(event.target.value) : event.target.value)} />
      {erro(campo)}{extra}
    </label>
  const mostraDicaEmail = emailPessoal(form.email)
  const tamanhoProblema = form.problema.trim().length

  return <form className="diagnostic-form" onSubmit={submit} noValidate>
    <button type="button" className="back-link" onClick={onVoltar}><ArrowLeft size={14} /> Voltar ao resultado</button>
    <div className="form-header">
      <span className="eyebrow">Último passo</span>
      <h2 ref={tituloRef} tabIndex={-1}>{diagnosticoTextos.formularioTitulo}</h2>
      <p className="form-intro"><span className="level-chip">{nivel.label}</span> Todos os campos são obrigatórios, exceto o problema de negócio e a newsletter.</p>
    </div>
    <input className="honeypot" name="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <Bloco numero="01" titulo="Sobre você">
      <div className="field-grid">
        {campoTexto('nome', 'Nome', { autoComplete: 'name', maxLength: limites.nome.max })}
        {campoTexto('email', 'E-mail corporativo', { type: 'email', autoComplete: 'email', maxLength: limites.email.max }, mostraDicaEmail && <small className="field-hint" id="diag-email-dica">{diagnosticoTextos.dicaEmailPessoal}</small>, mostraDicaEmail && 'diag-email-dica')}
        {campoTexto('empresa', 'Empresa', { autoComplete: 'organization', maxLength: limites.empresa.max })}
        {campoTexto('cargo', 'Cargo', { autoComplete: 'organization-title', maxLength: limites.cargo.max })}
        {campoTexto('telefone', 'Telefone / WhatsApp', { type: 'tel', autoComplete: 'tel', inputMode: 'numeric', placeholder: '(00) 00000-0000' })}
      </div>
    </Bloco>
    <Bloco numero="02" titulo="Sobre o desafio">
      <fieldset className="chip-group" aria-describedby={erros.como_conheceu ? 'diag-como_conheceu-erro' : undefined}>
        <legend className="field-label">Como conheceu o CITi {obrigatorio}</legend>
        <div className="chips">
          {comoConheceuOpcoes.map((opcao, index) => <label className="chip" key={opcao.value}>
            <input type="radio" name="como_conheceu" id={index === 0 ? 'diag-como_conheceu' : undefined} value={opcao.value} checked={form.como_conheceu === opcao.value} onChange={() => update('como_conheceu', opcao.value)} />
            <span>{opcao.label}</span>
          </label>)}
        </div>
        {erro('como_conheceu')}
      </fieldset>
      <label className="field" htmlFor="diag-problema"><span className="field-label">Qual problema de negócio você quer resolver? <span className="field-optional">(opcional)</span></span>
        <textarea {...ariaCampo('problema', 'diag-problema-contador')} name="problema" maxLength={limites.problema.max} placeholder={diagnosticoTextos.problemaPlaceholder} value={form.problema} onChange={(event) => update('problema', event.target.value)} />
        <small className="field-hint char-counter" id="diag-problema-contador">{tamanhoProblema} de {limites.problema.max} caracteres</small>
        {erro('problema')}
      </label>
    </Bloco>
    <Bloco numero="03" titulo="Autorização">
      <label className="toggle-row" htmlFor="diag-consentimento_contato">
        <input {...ariaCampo('consentimento_contato')} type="checkbox" name="consentimento_contato" required checked={form.consentimento_contato} onChange={(event) => update('consentimento_contato', event.target.checked)} />
        <span className="toggle" aria-hidden="true" />
        <span>{diagnosticoTextos.consentimentoContato} {obrigatorio}</span>
      </label>
      {erro('consentimento_contato')}
      <label className="toggle-row" htmlFor="diag-newsletter_optin">
        <input id="diag-newsletter_optin" type="checkbox" name="newsletter_optin" checked={form.newsletter_optin} onChange={(event) => update('newsletter_optin', event.target.checked)} />
        <span className="toggle" aria-hidden="true" />
        <span>{diagnosticoTextos.newsletter} <span className="field-optional">(opcional)</span></span>
      </label>
      <small className="privacy-note">{diagnosticoTextos.privacidade} Leia a {politicaPrivacidadeUrl ? <a href={politicaPrivacidadeUrl}>Política de privacidade</a> : <span>Política de privacidade (em breve)</span>}.</small>
    </Bloco>
    {estado === 'erro' && <p className="form-error form-error-banner" role="alert">{mensagemErro}</p>}
    <button type="submit" className="button-primary submit-button" disabled={estado === 'enviando'} aria-busy={estado === 'enviando'}>
      {estado === 'enviando' ? <><LoaderCircle size={18} className="spin" aria-hidden="true" /> Enviando...</> : <>Enviar solicitação <ArrowRight size={18} /></>}
    </button>
  </form>
}
