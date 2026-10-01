import { useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SEO } from '../components/SEO'
import { useUtm } from '../hooks/useUtm'
import { submitDiagnostico, type DiagnosticoInput } from '../services/leads'

interface FormState {
  nome: string
  email: string
  empresa: string
  cargo: string
  telefone: string
  como_conheceu: string
  problema: string
  consentimento_contato: boolean
  newsletter_optin: boolean
  website: string
}

const initialForm: FormState = { nome: '', email: '', empresa: '', cargo: '', telefone: '', como_conheceu: '', problema: '', consentimento_contato: false, newsletter_optin: false, website: '' }
const personalDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'bol.com.br', 'uol.com.br']

function emailIsPersonal(email: string) { return personalDomains.some((domain) => email.toLowerCase().endsWith(`@${domain}`)) }
function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 13)
  if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim()
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim()
}

export function Diagnostico() {
  const [params] = useSearchParams()
  const utm = useUtm()
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [serverError, setServerError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const openedAt = useRef(Date.now())
  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => setForm((current) => ({ ...current, [key]: value }))

  function validate() {
    const next: Record<string, string> = {}
    if (form.nome.trim().length < 2 || form.nome.trim().length > 120) next.nome = 'Informe seu nome (2 a 120 caracteres).'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) next.email = 'Informe um e-mail válido.'
    if (form.empresa.trim().length < 2 || form.empresa.trim().length > 160) next.empresa = 'Informe sua empresa (2 a 160 caracteres).'
    if (form.cargo.trim().length < 2 || form.cargo.trim().length > 120) next.cargo = 'Informe seu cargo (2 a 120 caracteres).'
    if (form.telefone && (form.telefone.replace(/\D/g, '').length < 10 || form.telefone.replace(/\D/g, '').length > 13)) next.telefone = 'Informe um telefone válido.'
    if (!form.como_conheceu) next.como_conheceu = 'Selecione uma opção.'
    if (form.problema.trim().length < 30 || form.problema.trim().length > 3000) next.problema = 'Conte o problema em 30 a 3000 caracteres.'
    if (!form.consentimento_contato) next.consentimento_contato = 'Você precisa autorizar o contato.'
    return next
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const validation = validate()
    setErrors(validation)
    setServerError('')
    if (form.website || Date.now() - openedAt.current < 3000) { setStatus('success'); return }
    if (Object.keys(validation).length) { window.requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return }
    setStatus('loading')
    const input: DiagnosticoInput = { nome: form.nome, email: form.email, empresa: form.empresa, cargo: form.cargo, telefone: form.telefone, como_conheceu: form.como_conheceu, problema: form.problema, consentimento_contato: form.consentimento_contato, newsletter_optin: form.newsletter_optin, origem: params.get('origem') ?? '', pagina_referencia: document.referrer, utm }
    const result = await submitDiagnostico(input)
    if (result.ok) setStatus('success')
    else { setStatus('idle'); setServerError(result.erro) }
  }

  return <><SEO title="Solicitar diagnóstico" description="Conte o problema. A gente ajuda a entender." /><section className="diagnostic-page container"><div className="diagnostic-intro"><span className="eyebrow">Solicitar diagnóstico</span><h1>Conte o <strong>problema.</strong><br />A gente ajuda a <strong>entender.</strong></h1><p>Uma conversa inicial para organizar o desafio e descobrir caminhos possíveis, sem compromisso.</p><h2>Como funciona</h2><ol><li>Você conta o desafio.</li><li>Nosso time analisa e entra em contato.</li><li>Conversa de Discovery sem compromisso.</li></ol><small>TODO: confirmar prazo de retorno com o Comercial.</small></div><div className="diagnostic-card">{status === 'success' ? <div className="success-state"><span className="eyebrow">Recebemos sua mensagem</span><h2>Obrigado por <strong>compartilhar.</strong></h2><p>Nosso time vai analisar o contexto e entrar em contato.</p><Link className="button-primary" to="/blog/artigos">Enquanto isso, leia nossos artigos</Link></div> : <form ref={formRef} onSubmit={submit} noValidate><h2>Sobre o seu desafio</h2><input className="honeypot" name="website" value={form.website} onChange={(event) => update('website', event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" />{(['nome', 'email', 'empresa', 'cargo'] as const).map((key) => <label key={key} htmlFor={key}>{key === 'nome' ? 'Nome *' : key === 'email' ? 'E-mail corporativo *' : key === 'empresa' ? 'Empresa *' : 'Cargo *'}<input id={key} name={key} type={key === 'email' ? 'email' : 'text'} value={form[key]} onChange={(event) => update(key, event.target.value)} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${key}-error` : undefined} />{errors[key] && <small id={`${key}-error`} className="form-error">{errors[key]}</small>}{key === 'email' && emailIsPersonal(form.email) && <small className="field-hint">Se tiver, prefira o e-mail da empresa.</small>}</label>)}<label htmlFor="telefone">Telefone / WhatsApp<input id="telefone" name="telefone" value={form.telefone} onChange={(event) => update('telefone', maskPhone(event.target.value))} aria-invalid={Boolean(errors.telefone)} aria-describedby={errors.telefone ? 'telefone-error' : undefined} />{errors.telefone && <small id="telefone-error" className="form-error">{errors.telefone}</small>}</label><label htmlFor="como_conheceu">Como conheceu o CITi *<select id="como_conheceu" value={form.como_conheceu} onChange={(event) => update('como_conheceu', event.target.value)} aria-invalid={Boolean(errors.como_conheceu)} aria-describedby={errors.como_conheceu ? 'como-error' : undefined}><option value="">Selecione</option><option value="linkedin">LinkedIn</option><option value="instagram">Instagram</option><option value="indicacao">Indicação</option><option value="google">Google</option><option value="blog">Blog do CITi</option><option value="evento">Evento</option><option value="outro">Outro</option></select>{errors.como_conheceu && <small id="como-error" className="form-error">{errors.como_conheceu}</small>}</label><label htmlFor="problema">Qual problema de negócio você quer resolver? *<textarea id="problema" name="problema" minLength={30} maxLength={3000} placeholder="Conte o contexto, o que está travando e o que você espera resolver." value={form.problema} onChange={(event) => update('problema', event.target.value)} aria-invalid={Boolean(errors.problema)} aria-describedby="problema-count" /><small id="problema-count">{form.problema.length}/3000 caracteres</small>{errors.problema && <small className="form-error">{errors.problema}</small>}</label><label className="check-label"><input type="checkbox" checked={form.consentimento_contato} onChange={(event) => update('consentimento_contato', event.target.checked)} aria-invalid={Boolean(errors.consentimento_contato)} /> Autorizo o CITi a entrar em contato sobre esta solicitação.</label><label className="check-label"><input type="checkbox" checked={form.newsletter_optin} onChange={(event) => update('newsletter_optin', event.target.checked)} /> Quero receber a newsletter do CITi (em breve).</label><p className="privacy-note">Seus dados serão usados apenas para responder à sua solicitação. Leia a <a href="#">Política de privacidade</a>. <span>TODO</span></p>{serverError && <p className="form-error" role="alert">{serverError}</p>}<button className="button-primary" disabled={status === 'loading'}>{status === 'loading' ? 'Enviando...' : 'Enviar solicitação'}</button></form>}</div></section></>
}