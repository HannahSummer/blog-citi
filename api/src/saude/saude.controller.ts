import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation, ApiSecurity } from '@nestjs/swagger'
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { PrismaService } from '../prisma/prisma.service'

// GET /api/saude: usado pelo healthcheck do Coolify. Responde 503 se o banco não responder.
@SkipThrottle()
@ApiTags('Sistema')
@Controller('saude')
export class SaudeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async verificar() {
    try {
      await this.prisma.$queryRaw`select 1`
      return { ok: true }
    } catch {
      throw new ServiceUnavailableException({ ok: false, erro: 'Banco indisponível.' })
    }
  }
}
