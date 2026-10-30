import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'
import { LimiteEnviosGuard } from './limite/limite-envios.guard'
import { PrismaModule } from './prisma/prisma.module'
import { SaudeController } from './saude/saude.controller'
import { DiagnosticosModule } from './diagnosticos/diagnosticos.module'
import { NewsletterModule } from './newsletter/newsletter.module'
import { AuthModule } from './auth/auth.module'
import { NoticiasModule } from './noticias/noticias.module'
import { RadarModule } from './radar/radar.module'
import { LeadsModule } from './leads/leads.module'

@Module({
  imports: [
    // Limite padrão por IP; formulários e login têm limites menores (@Throttle nos controllers).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    DiagnosticosModule,
    NewsletterModule,
    AuthModule,
    NoticiasModule,
    RadarModule,
    LeadsModule,
  ],
  controllers: [SaudeController],
  providers: [{ provide: APP_GUARD, useClass: LimiteEnviosGuard }],
})
export class AppModule {}
