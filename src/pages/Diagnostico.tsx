import { useState, type FormEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { SEO } from '../components/SEO'
import { siteConfig } from '../config/site'
import { diagnosticoPerguntas, diagnosticoResultados } from '../config/diagnostico'
import { useUtm, type UtmParams } from '../hooks/useUtm'

interface ContactFormState { nome: string; email: string; empresa: string; cargo: string; telefone: string; consentimento: boolean; website: string }
const initialContactForm: ContactFormState = { nome: '', email: '', empresa: '', cargo: '', telefone: '', consentimento: false, website: '' }
const personalDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'bol.com.br', 'uol.com.br']
function emailIsPersonal(email: string) { return personalDomains.some((domain) => email.toLowerCase().endsWith(`@${domain}`)) }
function buildContactUrl(origin: string, utm: UtmParams) {
  const base = siteConfig.ctaContatoUrl || 'mailto:contato@TODO'
  if (!siteConfig.ctaContatoUrl) console.warn('[diagnostico] ctaContatoUrl está vazio; usando contato@TODO')
  const params = new URLSearchParams({ origem: origin || 'diagnostico' })
  Object.entries(utm).forEach(([key, value]) => value && params.set(key, value))
  return `${base}${base.includes('?') ? '&' : '?'}${params.toString()}`
}

function ContactForm() {
  const [params] = useSearchParams()
  const utm = useUtm()
  const [form, setForm] = useState(initialContactForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [openedAt] = useState(Date.now())
  const update = (key: keyof ContactFormState, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }))
  function submit(event: FormEvent) {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (form.nome.trim().length < 2 || form.nome.trim().length > 120) next.nome = 'Informe seu nome (2 a 120 caracteres).'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) next.email = 'Informe um e-mail válido.'
    if (form.empresa.trim().length < 2 || form.empresa.trim().length > 160) next.empresa = 'Informe sua empresa (2 a 160 caracteres).'
    if (form.cargo.trim().length < 2 || form.cargo.trim().length > 120) next.cargo = 'Informe seu cargo (2 a 120 caracteres).'
    if (form.telefone && !/^\d{10,13}$/.test(form.telefone)) next.telefone = 'Use apenas 10 a 13 dígitos.'
    if (!form.consentimento) next.consentimento = 'Autorize o contato para continuar.'
    if (form.website || Date.now() - openedAt < 3000) return
    setErrors(next)
  }
  return <form onSubmit={submit} noValidate data-origem={params.get('origem') ?? ''} data-utm-source={utm.utm_source ?? ''}><h2>Fale com o CITi</h2><input className="honeypot" name="website" value={form.website} onChange={(event) => update('website', event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" />{(['nome', 'email', 'empresa', 'cargo'] as const).map((key) => <label key={key} htmlFor={`contact-${key}`}>{key === 'nome' ? 'Nome *' : key === 'email' ? 'E-mail corporativo *' : key === 'empresa' ? 'Empresa *' : 'Cargo *'}<input id={`contact-${key}`} type={key === 'email' ? 'email' : 'text'} value={form[key]} onChange={(event) => update(key, event.target.value)} />{errors[key] && <small className="form-error">{errors[key]}</small>}{key === 'email' && emailIsPersonal(form.email) && <small className="field-hint">Se tiver, prefira o e-mail da empresa.</small>}</label>)}<label htmlFor="contact-telefone">Número (WhatsApp)<input id="contact-telefone" inputMode="numeric" value={form.telefone} onChange={(event) => update('telefone', event.target.value.replace(/\D/g, '').slice(0, 13))} />{errors.telefone && <small className="form-error">{errors.telefone}</small>}</label><label className="check-label"><input type="checkbox" checked={form.consentimento} onChange={(event) => update('consentimento', event.target.checked)} /> Autorizo o CITi a entrar em contato sobre esta solicitação.</label>{errors.consentimento && <small className="form-error">{errors.consentimento}</small>}<button className="button-primary">Enviar solicitação</button></form>
}

export function Diagnostico() {
  const [params] = useSearchParams()
  const utm = useUtm()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [complete, setComplete] = useState(false)
  const question = diagnosticoPerguntas[step]
  const score = Object.values(answers).reduce((total, value) => total + value, 0)
  const result = score <= 4 ? diagnosticoResultados.comecando : score <= 8 ? diagnosticoResultados.evolucao : diagnosticoResultados.estruturado
  const answer = (points: number) => { setAnswers((current) => ({ ...current, [question.id]: points })); if (step < diagnosticoPerguntas.length - 1) setStep((current) => current + 1); else setComplete(true) }
  const back = () => { if (complete) setComplete(false); else setStep((current) => Math.max(0, current - 1)) }
  const contactUrl = complete ? buildContactUrl(params.get('origem') ?? '', utm) : ''
  return <><SEO title="Faça seu diagnóstico" description="Avalie a maturidade dos processos e decisões digitais da sua empresa." /><section className="diagnostic-page container"><div className="diagnostic-intro"><span className="eyebrow">Faça seu diagnóstico</span><h1>Entenda onde sua empresa <strong>está.</strong></h1><p>Responda a seis perguntas rápidas sobre processos, sistemas e decisões digitais. O resultado fica só com você nesta fase.</p><h2>Como funciona</h2><ol><li>Você responde uma pergunta por vez.</li><li>A soma mostra um ponto de partida.</li><li>Você escolhe o próximo passo.</li></ol></div><div className="diagnostic-card">{siteConfig.diagnosticoComBanco ? <ContactForm /> : complete ? <div className="diagnostic-result"><span className="eyebrow">Seu resultado</span><h2>{result.label}</h2><p>{result.description}</p><ul>{result.steps.map((item) => <li key={item}>{item}</li>)}</ul><div className="cta-row"><button className="button-secondary" onClick={back}>Voltar</button><a className="button-primary" href={contactUrl} target="_blank" rel="noreferrer">Falar com o CITi <ArrowUpRight size={17} /></a></div></div> : <div className="diagnostic-question"><div className="diagnostic-progress"><span>Pergunta {step + 1} de {diagnosticoPerguntas.length}</span><progress value={step + 1} max={diagnosticoPerguntas.length} /></div><fieldset><legend>{question.question}</legend>{question.options.map((option) => <label className="quiz-option" key={option.label}><input type="radio" name={question.id} checked={answers[question.id] === option.points} onChange={() => answer(option.points)} /><span>{option.label}</span></label>)}</fieldset><button className="button-secondary" onClick={back} disabled={step === 0}>Voltar</button></div>}</div></section></>
}
