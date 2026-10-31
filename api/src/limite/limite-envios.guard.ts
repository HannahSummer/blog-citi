import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'

// Limite de envios por IP. Ligado sempre, exceto quando LIMITE_ENVIOS=false (só os testes definem isso).
@Injectable()
export class LimiteEnviosGuard extends ThrottlerGuard {
  protected async shouldSkip(): Promise<boolean> {
    return process.env.LIMITE_ENVIOS === 'false'
  }
}
