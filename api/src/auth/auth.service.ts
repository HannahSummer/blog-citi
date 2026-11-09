import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { conferirSenha, HASH_FALSO } from './senha'

export interface Editora { id: string; email: string }

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async entrar(email: string, senha: string) {
    const editora = await this.prisma.editora.findUnique({ where: { email: email.trim().toLowerCase() } })
    const senhaOk = await conferirSenha(senha, editora?.senha_hash ?? HASH_FALSO)
    if (!editora || !editora.ativo || !senhaOk) throw new UnauthorizedException({ erro: 'E-mail ou senha incorretos.' })
    const token = await this.jwt.signAsync({ sub: editora.id, email: editora.email })
    return { token, email: editora.email }
  }

  // Confere o token e se a conta ainda está ativa (desativar no banco corta o acesso na hora).
  async editoraDoToken(token: string): Promise<Editora> {
    try {
      const { sub } = await this.jwt.verifyAsync<{ sub: string }>(token)
      const editora = await this.prisma.editora.findUnique({ where: { id: sub } })
      if (editora?.ativo) return { id: editora.id, email: editora.email }
    } catch { /* token inválido ou expirado */ }
    throw new UnauthorizedException({ erro: 'Sessão expirada. Entre de novo.' })
  }
}
