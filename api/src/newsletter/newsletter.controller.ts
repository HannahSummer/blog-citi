import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation, ApiSecurity } from '@nestjs/swagger'
import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { PrismaService } from '../prisma/prisma.service'
import { curto, ehObjeto, texto } from '../comum/texto'
import { EMAIL_REGEX, limites } from '../../../src/lib/diagnostico-schema'

@ApiTags('Newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly prisma: PrismaService) {}

  // POST /api/newsletter: inscrição pelo site. E-mail já inscrito responde ok, sem revelar nada.
  @ApiOperation({ summary: 'Inscrever um e-mail na newsletter' })
  @ApiBody({ schema: { type: 'object', required: ['email', 'consentimento_versao'], properties: { email: { type: 'string' }, consentimento_versao: { type: 'string' }, origem: { type: 'string' } } } })
  @Post()
  @HttpCode(201)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async inscrever(@Body() corpo: unknown) {
    if (!ehObjeto(corpo)) throw new BadRequestException({ erro: 'Envio inválido.' })
    const email = texto(corpo.email).toLowerCase()
    const versao = texto(corpo.consentimento_versao)
    if (!email || email.length > limites.email.max || !EMAIL_REGEX.test(email)) throw new BadRequestException({ erro: 'Informe um e-mail válido.' })
    if (!versao || versao.length > 60) throw new BadRequestException({ erro: 'Versão do consentimento ausente.' })
    await this.prisma.newsletterInscricao.createMany({ data: [{ email, origem: curto(corpo.origem) ?? 'site', consentimento_versao: versao }], skipDuplicates: true })
    return { ok: true }
  }
}
