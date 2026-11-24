import { Injectable } from '@nestjs/common'
import { createHash } from 'node:crypto'
import { PrismaService } from '../prisma/prisma.service'
import { config } from '../config'
import { ehObjeto, texto } from '../comum/texto'

// Robôs, prévias de link e testes automáticos não contam como visita.
const ROBO = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|lighthouse|headless|curl|wget|python|axios|node-fetch|superagent|postman/i
const dia = (data: Date) => data.toISOString().slice(0, 10)
const curto = (valor: unknown, max: number) => texto(valor).slice(0, max) || null

export function dispositivoDo(userAgent: string): 'celular' | 'tablet' | 'computador' {
  if (/iPad|Tablet/i.test(userAgent)) return 'tablet'
  if (/Mobi|Android|iPhone/i.test(userAgent)) return 'celular'
  return 'computador'
}

// Site de onde a pessoa veio. Links internos do próprio blog não são origem.
export function origemDo(referrer: string, hostsDoSite: string[]) {
  if (!referrer) return 'direto'
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '')
    return hostsDoSite.includes(host) ? null : host.slice(0, 200)
  } catch {
    return 'direto'
  }
}

export interface DadosVisita { corpo: unknown; ip: string; userAgent: string }

@Injectable()
export class MetricasService {
  constructor(private readonly prisma: PrismaService) {}

  private hostsDoSite() {
    return config.siteUrls.flatMap((url) => { try { return [new URL(url).hostname.replace(/^www\./, '')] } catch { return [] } })
  }

  // Registra uma página vista. Devolve false quando a visita é ignorada (robô, painel ou dado inválido).
  async registrar({ corpo, ip, userAgent }: DadosVisita) {
    if (!ehObjeto(corpo) || !userAgent || ROBO.test(userAgent)) return false
    const caminho = texto(corpo.caminho).split(/[?#]/)[0].slice(0, 300)
    if (!caminho.startsWith('/') || caminho.startsWith('/blog/admin')) return false
    const entrada = corpo.entrada === true
    // Código do visitante: muda todo dia e não permite voltar ao IP (a chave diária vem do JWT_SECRET).
    const chaveDoDia = createHash('sha256').update(`${dia(new Date())}|${config.jwtSecret}`).digest('hex')
    const visitante = createHash('sha256').update(`${chaveDoDia}|${ip}|${userAgent}`).digest('hex').slice(0, 16)
    await this.prisma.visita.create({
      data: {
        caminho,
        entrada,
        origem: entrada ? origemDo(texto(corpo.referrer), this.hostsDoSite()) : null,
        utm_source: entrada ? curto(corpo.utm_source, 100) : null,
        utm_medium: entrada ? curto(corpo.utm_medium, 100) : null,
        utm_campaign: entrada ? curto(corpo.utm_campaign, 100) : null,
        dispositivo: dispositivoDo(userAgent),
        visitante,
      },
    })
    return true
  }

  // Resumo do período para o painel de métricas.
  async resumo(dias: number) {
    const desde = new Date(Date.now() - dias * 86_400_000)
    const noPeriodo = { criado_em: { gte: desde } }
    const entradas = { ...noPeriodo, entrada: true }
    const [visualizacoes, visitas, porDiaBruto, paginas, origens, campanhas, dispositivos] = await Promise.all([
      this.prisma.visita.count({ where: noPeriodo }),
      this.prisma.visita.count({ where: entradas }),
      // Dia no fuso de Recife, para o gráfico bater com o calendário de quem lê.
      this.prisma.$queryRaw<Array<{ dia: string; visualizacoes: number; visitantes: number }>>`
        select to_char(criado_em at time zone 'America/Recife', 'YYYY-MM-DD') as dia,
               count(*)::int as visualizacoes,
               count(distinct visitante)::int as visitantes
        from visitas where criado_em >= ${desde} group by 1 order by 1`,
      this.prisma.visita.groupBy({ by: ['caminho'], where: noPeriodo, _count: { _all: true }, orderBy: { _count: { caminho: 'desc' } }, take: 10 }),
      this.prisma.visita.groupBy({ by: ['origem'], where: { ...entradas, origem: { not: null } }, _count: { _all: true }, orderBy: { _count: { origem: 'desc' } }, take: 10 }),
      this.prisma.visita.groupBy({ by: ['utm_source', 'utm_medium', 'utm_campaign'], where: { ...entradas, utm_source: { not: null } }, _count: { _all: true }, orderBy: { _count: { utm_source: 'desc' } }, take: 10 }),
      this.prisma.visita.groupBy({ by: ['dispositivo'], where: entradas, _count: { _all: true }, orderBy: { _count: { dispositivo: 'desc' } } }),
    ])

    // Preenche os dias sem visita com zero, para o gráfico não pular datas.
    const mapa = new Map(porDiaBruto.map((linha) => [linha.dia, linha]))
    const porDia = Array.from({ length: dias }, (_, indice) => {
      const data = new Date(Date.now() - (dias - 1 - indice) * 86_400_000)
      const chave = data.toLocaleDateString('en-CA', { timeZone: 'America/Recife' })
      const linha = mapa.get(chave)
      return { dia: chave, visualizacoes: linha?.visualizacoes ?? 0, visitantes: linha?.visitantes ?? 0 }
    })

    return {
      dias,
      visualizacoes,
      visitas,
      // Soma dos visitantes únicos de cada dia (a mesma pessoa em dois dias conta duas vezes).
      visitantes: porDia.reduce((total, linha) => total + linha.visitantes, 0),
      porDia,
      paginas: paginas.map((linha) => ({ caminho: linha.caminho, total: linha._count._all })),
      origens: origens.map((linha) => ({ origem: linha.origem as string, total: linha._count._all })),
      campanhas: campanhas.map((linha) => ({ source: linha.utm_source, medium: linha.utm_medium, campaign: linha.utm_campaign, total: linha._count._all })),
      dispositivos: dispositivos.map((linha) => ({ dispositivo: linha.dispositivo, total: linha._count._all })),
    }
  }
}
