import { Body, Controller, Get, HttpCode, Post, Query, Req, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { EditoraGuard } from '../auth/editora.guard'
import { MetricasService } from './metricas.service'

@ApiTags('Métricas')
@Controller()
export class MetricasController {
  constructor(private readonly metricas: MetricasService) {}

  // POST /api/metricas/visita: o site avisa cada página aberta. Anônimo, sem cookie e sem guardar IP.
  @ApiOperation({ summary: 'Registrar uma página vista (anônimo)' })
  @Post('metricas/visita')
  @HttpCode(204)
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async registrar(@Body() corpo: unknown, @Req() requisicao: Request) {
    await this.metricas.registrar({ corpo, ip: requisicao.ip ?? '', userAgent: requisicao.headers['user-agent'] ?? '' })
  }

  // GET /api/admin/metricas?dias=30: resumo para o painel. Só editoras.
  @ApiOperation({ summary: 'Resumo de acessos do período (7, 30 ou 90 dias)' })
  @ApiBearerAuth()
  @Get('admin/metricas')
  @UseGuards(EditoraGuard)
  resumo(@Query('dias') dias?: string) {
    const periodo = [7, 30, 90].includes(Number(dias)) ? Number(dias) : 30
    return this.metricas.resumo(periodo)
  }
}
