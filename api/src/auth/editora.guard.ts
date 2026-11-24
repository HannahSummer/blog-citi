import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'
import { AuthService, type Editora } from './auth.service'

export type RequisicaoComEditora = Request & { editora: Editora }

// Protege as rotas do painel: exige "Authorization: Bearer <token do login>".
@Injectable()
export class EditoraGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(contexto: ExecutionContext) {
    const requisicao = contexto.switchToHttp().getRequest<RequisicaoComEditora>()
    const [tipo, token] = requisicao.headers.authorization?.split(' ') ?? []
    if (tipo !== 'Bearer' || !token) throw new UnauthorizedException({ erro: 'Entre com a conta de editora.' })
    requisicao.editora = await this.auth.editoraDoToken(token)
    return true
  }
}
