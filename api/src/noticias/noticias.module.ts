import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { NoticiasAdminController, NoticiasPublicasController } from './noticias.controller'
import { NoticiasService } from './noticias.service'

@Module({ imports: [AuthModule], controllers: [NoticiasPublicasController, NoticiasAdminController], providers: [NoticiasService] })
export class NoticiasModule {}
