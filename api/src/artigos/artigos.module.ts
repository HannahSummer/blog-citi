import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ArtigosController } from './artigos.controller'
import { ArtigosService } from './artigos.service'

@Module({ imports: [AuthModule], controllers: [ArtigosController], providers: [ArtigosService] })
export class ArtigosModule {}
