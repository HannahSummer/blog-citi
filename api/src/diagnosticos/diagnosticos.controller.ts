import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation, ApiSecurity } from '@nestjs/swagger'
import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { DiagnosticosService } from './diagnosticos.service'

@ApiTags('Diagnóstico')
@Controller('diagnosticos')
export class DiagnosticosController {
  constructor(private readonly diagnosticos: DiagnosticosService) {}

  // POST /api/diagnosticos: formulário do site. Só grava; ninguém lê leads por aqui.
  @ApiOperation({ summary: 'Enviar um lead do diagnóstico (só com consentimento de contato)' })
  @ApiBody({ description: 'Campos do formulário, respostas (0 a 2 por pergunta) e consentimento' })
  @Post()
  @HttpCode(201)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async registrar(@Body() corpo: unknown) {
    await this.diagnosticos.registrar(corpo)
    return { ok: true }
  }
}
