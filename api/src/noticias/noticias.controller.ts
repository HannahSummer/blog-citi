import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation, ApiSecurity } from '@nestjs/swagger'
import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, Req, UseGuards } from '@nestjs/common'
import { EditoraGuard, type RequisicaoComEditora } from '../auth/editora.guard'
import { eRepetido } from '../prisma/prisma.service'
import { statusNoticia, type StatusNoticia } from '../../../src/config/noticias'
import { NoticiasService } from './noticias.service'
import { validarEdicao } from './validacao'

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
