import { ArrowUpRight, Check } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { subscribeNewsletter } from '../services/leads'

export function NewsletterBlock({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  async function submit(event: FormEvent) { event.preventDefault(); if (!email.trim()) return; setState('loading'); try { await subscribeNewsletter(email); setState('success') } catch { setState('error') } }
  return <section className={compact ? 'newsletter newsletter-compact' : 'newsletter'} id={compact ? undefined : 'newsletter'}><span className="ghost-number">03</span><div className="newsletter-content"><span className="eyebrow">Uma carta de vez em quando</span><h2>Boas ideias não precisam <strong>gritar.</strong></h2>{state === 'success' ? <p className="success-message"><Check size={18} /> Obrigado. A próxima edição é sua.</p> : <form onSubmit={submit}><label htmlFor={compact ? 'compact-email' : 'email'}>Seu melhor e-mail</label><div className="input-row"><input id={compact ? 'compact-email' : 'email'} type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@empresa.com" /><button className="icon-button button-green" disabled={state === 'loading'} aria-label="Assinar newsletter">{state === 'loading' ? '...' : <ArrowUpRight size={19} />}</button></div>{state === 'error' && <small role="alert">Não foi possível enviar agora.</small>}<label className="consent"><input type="checkbox" required /> Aceito receber a newsletter do CITi e posso cancelar quando quiser.</label></form>}</div></section>
}
