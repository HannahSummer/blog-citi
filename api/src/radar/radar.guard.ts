import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { timingSafeEqual } from 'node:crypto'
import type { Request } from 'express'
import { config } from '../config'

// O radar semanal (GitHub Actions) se identifica com "Authorization: Bearer <RADAR_TOKEN>".
@Injectable()
export class RadarGuard implements CanActivate {
  canActivate(contexto: ExecutionContext) {
    const [tipo, token] = contexto.switchToHttp().getRequest<Request>().headers.authorization?.split(' ') ?? []
    const recebido = Buffer.from(token ?? '')
    const esperado = Buffer.from(config.radarToken)
    if (tipo !== 'Bearer' || recebido.length !== esperado.length || !timingSafeEqual(recebido, esperado)) throw new UnauthorizedException({ erro: 'Token do radar inválido.' })
    return true
  }
}
