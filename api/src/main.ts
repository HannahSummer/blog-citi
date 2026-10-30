import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { configurarApp } from './app.setup'
import { config } from './config'

async function bootstrap() {
  const app = configurarApp(await NestFactory.create<NestExpressApplication>(AppModule))
  if (config.swaggerHabilitado) console.log('Documentação da API em /api/docs')
  await app.listen(config.porta, '0.0.0.0')
  console.log(`API do Blog CITi ouvindo na porta ${config.porta}`)
}

bootstrap()
