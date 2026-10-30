import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { StatusNoticia } from '../../../src/config/noticias'
import type { CamposEditaveis } from './validacao'

// Só o que aparece no site público.
const COLUNAS_PUBLICAS = { id: true, titulo: true, resumo: true, por_que_importa: true, categoria: true, subtema: true, continente: true, fonte: true, link: true, data_fonte: true, publicado_em: true } as const

@Injectable()
export class NoticiasService {
  constructor(private readonly prisma: PrismaService) {}

  publicadas() {
    return this.prisma.noticia.findMany({ where: { status: 'aprovada' }, select: COLUNAS_PUBLICAS, orderBy: { publicado_em: 'desc' }, take: 60 })
  }

  // Painel: pendentes pela pontuação do radar; as demais pela revisão mais recente.
  listar(status: StatusNoticia) {
    const ordem = status === 'pendente' ? { pontuacao: { sort: 'desc', nulls: 'last' } } as const : { revisado_em: { sort: 'desc', nulls: 'last' } } as const
    return this.prisma.noticia.findMany({ where: { status }, orderBy: [{ semana: 'desc' }, ordem], take: 100 })
  }

  // Ao mudar o status, carimba quem revisou e quando; aprovar publica, qualquer outro status tira do ar.
  async salvar(id: string, campos: CamposEditaveis, editoraId: string) {
    const atual = await this.prisma.noticia.findUnique({ where: { id }, select: { status: true } })
    if (!atual) throw new NotFoundException({ erro: 'Notícia não encontrada.' })
    const mudouStatus = campos.status !== undefined && campos.status !== atual.status
    const agora = new Date()
    return this.prisma.noticia.update({
      where: { id },
      data: {
        ...campos,
        ...(mudouStatus ? { revisado_por: editoraId, revisado_em: agora, publicado_em: campos.status === 'aprovada' ? agora : null } : {}),
      },
    })
  }
}
