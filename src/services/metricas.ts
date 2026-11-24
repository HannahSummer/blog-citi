import { apiConfigurada, chamarApi } from '../lib/api'
import { lerToken } from './painel'

// Métricas de acesso. O registro é anônimo: sem cookie e sem guardar IP (ver docs/12-BACKEND-E-DEPLOY.md).

export interface Visita { caminho: string; entrada: boolean; referrer: string; utm_source: string; utm_medium: string; utm_campaign: string }

export function registrarVisita(visita: Visita) {
  if (!apiConfigurada) return
  // keepalive: o aviso chega mesmo se a pessoa sair da página logo em seguida.
  chamarApi('/metricas/visita', { metodo: 'POST', corpo: visita, keepalive: true }).catch(() => { /* métrica nunca atrapalha a navegação */ })
}

export interface ResumoMetricas {
  dias: number
  visualizacoes: number
  visitas: number
  visitantes: number
  porDia: Array<{ dia: string; visualizacoes: number; visitantes: number }>
  paginas: Array<{ caminho: string; total: number }>
  origens: Array<{ origem: string; total: number }>
  campanhas: Array<{ source: string | null; medium: string | null; campaign: string | null; total: number }>
  dispositivos: Array<{ dispositivo: string; total: number }>
}

export const buscarMetricas = (dias: number) => chamarApi<ResumoMetricas>(`/admin/metricas?dias=${dias}`, { token: lerToken() })
