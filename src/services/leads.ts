// TODO (dev): integrar com o backend/CRM definido pelo time. Nunca colocar chaves no frontend. Se newsletter_optin for true, inscrever também na lista da newsletter.
export interface DiagnosticLead {
  name: string
  email: string
  company: string
  problem: string
  [key: string]: unknown
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

export async function submitDiagnostico(payload: DiagnosticLead) {
  await wait(800)
  console.info('[mock] submitDiagnostico', payload)
  return { ok: true }
}

export async function subscribeNewsletter(email: string, origem = 'site') {
  await wait(800)
  console.info('[mock] subscribeNewsletter', { email, origem })
  return { ok: true }
}
