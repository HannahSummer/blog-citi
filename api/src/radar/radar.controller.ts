import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation, ApiSecurity } from '@nestjs/swagger'
import { BadRequestException, Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { PrismaService, eRepetido } from '../prisma/prisma.service'
import { ehObjeto } from '../comum/texto'
import { validarSugestao } from '../noticias/validacao'
import { RadarGuard } from './radar.guard'

@ApiTags('Radar (GitHub Actions)')
@ApiSecurity('radar')
@Controller('radar')
@UseGuards(RadarGuard)
@SkipThrottle()
export class RadarController {
  constructor(private readonly prisma: PrismaService) {}

  // POST /api/radar/noticias: { sugestoes: [...] }. Entram como `pendente` para revisão no painel.
  // Uma por uma, para que um item inválido não derrube os outros. Links repetidos são ignorados.
  @ApiOperation({ summary: 'Enviar sugestões de notícias (entram como pendentes)' })
  @ApiBody({ schema: { type: 'object', required: ['sugestoes'], properties: { sugestoes: { type: 'array', maxItems: 50, items: { type: 'object' } } } } })
  @Post('noticias')
  @HttpCode(200)
  async receber(@Body() corpo: unknown) {
    if (!ehObjeto(corpo) || !Array.isArray(corpo.sugestoes) || corpo.sugestoes.length > 50) throw new BadRequestException({ erro: 'Envie { sugestoes: [...] } com até 50 itens.' })
    let enviadas = 0
    let repetidas = 0
    const erros: string[] = []
    for (const item of corpo.sugestoes) {
      const { sugestao, erro } = validarSugestao(item)
      const rotulo = ehObjeto(item) && typeof item.titulo === 'string' ? item.titulo : 'sem título'
      if (!sugestao) { erros.push(`${rotulo}: ${erro}`); continue }
      try {
        await this.prisma.noticia.create({ data: sugestao })
        enviadas++
      } catch (e) {
        if (eRepetido(e)) repetidas++
        else erros.push(`${rotulo}: ${(e as Error).message}`)
      }
    }
    return { enviadas, repetidas, erros }
  }
}
