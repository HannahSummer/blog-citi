import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { config } from '../config'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { EditoraGuard } from './editora.guard'

@Module({
  // A sessão do painel dura 8 horas; depois é preciso entrar de novo.
  imports: [JwtModule.register({ secret: config.jwtSecret, signOptions: { expiresIn: '8h' } })],
  controllers: [AuthController],
  providers: [AuthService, EditoraGuard],
  exports: [AuthService, EditoraGuard],
})
export class AuthModule {}
