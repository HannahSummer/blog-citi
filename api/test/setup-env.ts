// Variáveis de ambiente dos testes. Carregado antes de qualquer import do app (ver jest.config.js).
// O banco de teste é separado do de desenvolvimento: nunca aponte para o banco real.
process.env.DATABASE_URL ??= 'postgresql://citi:citi@localhost:5433/blog_citi_teste'
process.env.JWT_SECRET = 'segredo-de-teste-com-mais-de-32-caracteres-0123456789'
process.env.RADAR_TOKEN = 'radar-de-teste-com-mais-de-32-caracteres-0123456789'
process.env.SITE_URL = 'http://localhost:5173'
process.env.SWAGGER_HABILITADO = 'true'
process.env.PORT = '0'
// Limite de envios desligado nos testes; o arquivo limite.spec.ts liga de novo.
process.env.LIMITE_ENVIOS = 'false'
