import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { EditoraGuard } from '../auth/editora.guard'
import { ArtigosService, configuracaoGithub } from './artigos.service'

// Painel de artigos (/blog/admin/artigos). Só editoras.
@ApiTags('Painel: artigos')
@ApiBearerAuth()
@Controller('admin/artigos')
@UseGuards(EditoraGuard)
export class ArtigosController {
  constructor(private readonly artigos: ArtigosService) {}

  // GET /api/admin/artigos/configuracao: o painel avisa quando falta configurar o GitHub.
  @ApiOperation({ summary: 'Saber se a publicação pelo GitHub está configurada' })
  @Get('configuracao')
  configuracao() {
    const { configurado, repositorio, branch } = configuracaoGithub()
    return { configurado, repositorio: configurado ? repositorio : null, branch }
  }

  // POST /api/admin/artigos: cria o arquivo do artigo no GitHub. O Coolify publica em seguida.
  @ApiOperation({ summary: 'Publicar um artigo novo (commit no GitHub)' })
  @ApiBody({ description: 'titulo, resumo, metaDescription, data, categoria, subtema, etapaFunil, ctaTipo, autor, palavrasChave, corpo (Markdown) e rascunho' })
  @Post()
  @HttpCode(201)
  publicar(@Body() corpo: unknown) {
    return this.artigos.publicar(corpo)
  }
}
