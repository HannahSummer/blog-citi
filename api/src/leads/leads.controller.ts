import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation, ApiSecurity } from '@nestjs/swagger'
import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { EditoraGuard } from '../auth/editora.guard'
import { PrismaService } from '../prisma/prisma.service'
import { ehObjeto } from '../comum/texto'

const STATUS_LEAD = ['novo', 'em_contato', 'qualificado', 'descartado']

// Painel de leads (/blog/admin/leads): diagnósticos e newsletter. Só editoras logadas.
@ApiTags('Painel: leads')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(EditoraGuard)
export class LeadsController {
  constructor(private readonly prisma: PrismaService) {}

  // GET /api/admin/diagnosticos: os 1000 mais recentes (o painel filtra e exporta CSV).
  @ApiOperation({ summary: 'Listar os 1000 leads mais recentes' })
  @Get('diagnosticos')
  diagnosticos() {
    return this.prisma.diagnostico.findMany({ orderBy: { created_at: 'desc' }, take: 1000 })
  }

  // PATCH /api/admin/diagnosticos/:id { status }: andamento do lead pelo Comercial.
  @ApiOperation({ summary: 'Mudar o status de um lead' })
  @ApiBody({ schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['novo', 'em_contato', 'qualificado', 'descartado'] } } } })
  @Patch('diagnosticos/:id')
  async atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() corpo: unknown) {
    if (!ehObjeto(corpo) || !STATUS_LEAD.includes(corpo.status as string)) throw new BadRequestException({ erro: 'status inválido.' })
    const existe = await this.prisma.diagnostico.findUnique({ where: { id }, select: { id: true } })
    if (!existe) throw new NotFoundException({ erro: 'Lead não encontrado.' })
    return this.prisma.diagnostico.update({ where: { id }, data: { status: corpo.status as string } })
  }

  // GET /api/admin/newsletter: lista para exportar e importar na ferramenta de newsletter.
  @ApiOperation({ summary: 'Listar inscritos na newsletter' })
  @Get('newsletter')
  newsletter() {
    return this.prisma.newsletterInscricao.findMany({ where: { ativo: true }, orderBy: { created_at: 'desc' }, select: { email: true, origem: true, created_at: true } })
  }
}
