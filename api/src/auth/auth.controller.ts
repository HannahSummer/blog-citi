import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation, ApiSecurity } from '@nestjs/swagger'
import { BadRequestException, Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ehObjeto, texto } from '../comum/texto'
import { AuthService } from './auth.service'
import { EditoraGuard, type RequisicaoComEditora } from './editora.guard'

@ApiTags('Login do painel')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // POST /api/auth/entrar: login do painel. Poucas tentativas por minuto contra força bruta.
  @ApiOperation({ summary: 'Entrar no painel (recebe o token de 8 horas)' })
  @ApiBody({ schema: { type: 'object', required: ['email', 'senha'], properties: { email: { type: 'string', example: 'editora@citi.org.br' }, senha: { type: 'string' } } } })
  @Post('entrar')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  entrar(@Body() corpo: unknown) {
    if (!ehObjeto(corpo) || !texto(corpo.email) || typeof corpo.senha !== 'string') throw new BadRequestException({ erro: 'Informe e-mail e senha.' })
    return this.auth.entrar(texto(corpo.email), corpo.senha)
  }

  // GET /api/auth/eu: o painel confirma se o token salvo ainda vale.
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confere se o token ainda vale' })
  @Get('eu')
  @UseGuards(EditoraGuard)
  eu(@Req() requisicao: RequisicaoComEditora) {
    return { email: requisicao.editora.email }
  }
}
