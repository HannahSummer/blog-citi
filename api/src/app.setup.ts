import type { INestApplication } from '@nestjs/common'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { config } from './config'

// Configuração comum da API: usada pelo main.ts e pelos testes, para que os dois sejam idênticos.
export function configurarApp(app: NestExpressApplication | INestApplication) {
  const expressApp = app as NestExpressApplication
  // Atrás do proxy do Coolify: o IP real vem no X-Forwarded-For (usado no limite de envios).
  expressApp.set?.('trust proxy', 1)
  app.setGlobalPrefix('api')
  app.enableCors({ origin: config.siteUrls, methods: ['GET', 'POST', 'PATCH'], allowedHeaders: ['Content-Type', 'Authorization'] })
  app.enableShutdownHooks()

  // Documentação interativa (Swagger) só quando SWAGGER_HABILITADO=true.
  if (config.swaggerHabilitado) {
    const documento = new DocumentBuilder()
      .setTitle('API do Blog CITi')
      .setDescription('Diagnóstico, newsletter, notícias e painel interno. Para as rotas do painel, entre em /api/auth/entrar e use o token no botão Authorize.')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', description: 'Token de editora (POST /api/auth/entrar)' }, 'editora')
      .addBearerAuth({ type: 'http', scheme: 'bearer', description: 'RADAR_TOKEN (só para o radar semanal)' }, 'radar')
      .build()
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, documento), { jsonDocumentUrl: 'api/docs-json' })
  }
  return app
}
