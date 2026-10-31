import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation, ApiSecurity } from '@nestjs/swagger'
import { BadRequestException, Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { EditoraGuard, type RequisicaoComEditora } from '../auth/editora.guard'
import { eRepetido } from '../prisma/prisma.service'
import { statusNoticia, type StatusNoticia } from '../../../src/config/noticias'
import { NoticiasService } from './noticias.service'
import { validarEdicao, validarNovaNoticia } from './validacao'

// GET /api/noticias: notícias aprovadas, para o site e o globo.
@ApiTags('Notícias (site)')
@Controller('noticias')
export class NoticiasPublicasController {
  constructor(private readonly noticias: NoticiasService) {}

  @ApiOperation({ summary: 'Notícias aprovadas (público)' })
  @Get()
  publicadas() { return this.noticias.publicadas() }
}

// Painel de curadoria (/blog/admin/noticias). Só editoras logadas.
@ApiTags('Painel: notícias')
@ApiBearerAuth()
@Controller('admin/noticias')
@UseGuards(EditoraGuard)
export class NoticiasAdminController {
  constructor(private readonly noticias: NoticiasService) {}

  @ApiOperation({ summary: 'Listar notícias por status (pendente, aprovada ou rejeitada)' })
  @Get()
  listar(@Query('status') status: string) {
    if (!statusNoticia.includes(status as StatusNoticia)) throw new BadRequestException({ erro: 'status inválido.' })
    return this.noticias.listar(status as StatusNoticia)
  }

  // POST /api/admin/noticias: notícia cadastrada à mão. Já entra publicada (quem cadastra é editora).
  @ApiOperation({ summary: 'Cadastrar uma notícia manualmente (publica na hora)' })
  @ApiBody({ description: 'titulo, resumo, por_que_importa, categoria, subtema, continente, fonte, link e data_fonte (AAAA-MM-DD, opcional)' })
  @Post()
  @HttpCode(201)
  async criar(@Body() corpo: unknown, @Req() requisicao: RequisicaoComEditora) {
    const { sugestao, erro } = validarNovaNoticia(corpo)
    if (!sugestao) throw new BadRequestException({ erro: `Revise a notícia: ${erro}` })
    try {
      return await this.noticias.criar(sugestao, requisicao.editora.id)
    } catch (e) {
      if (eRepetido(e)) throw new BadRequestException({ erro: 'Já existe uma notícia com esse link.' })
      throw e
    }
  }

  @ApiOperation({ summary: 'Editar, aprovar ou rejeitar uma notícia' })
  @ApiBody({ description: 'Campos editáveis e/ou status' })
  @Patch(':id')
  async salvar(@Param('id', ParseUUIDPipe) id: string, @Body() corpo: unknown, @Req() requisicao: RequisicaoComEditora) {
    try {
      return await this.noticias.salvar(id, validarEdicao(corpo), requisicao.editora.id)
    } catch (erro) {
      if (eRepetido(erro)) throw new BadRequestException({ erro: 'Já existe outra notícia com esse link.' })
      throw erro
    }
  }
}
