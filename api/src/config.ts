// Variáveis de ambiente da API. Lista completa e explicação em api/.env.example.
// A API não sobe se faltar alguma obrigatória: melhor falhar no deploy do que em produção.

function obrigatoria(nome: string, minimo = 1): string {
  const valor = process.env[nome]?.trim() ?? ''
  if (valor.length < minimo) throw new Error(`Variável de ambiente ${nome} ausente${minimo > 1 ? ` ou com menos de ${minimo} caracteres` : ''}. Veja api/.env.example.`)
  return valor
}

export const config = {
  porta: Number(process.env.PORT ?? 3000),
  jwtSecret: obrigatoria('JWT_SECRET', 32),
  radarToken: obrigatoria('RADAR_TOKEN', 32),
  // Liga a documentação Swagger em /api/docs. Desligada por padrão.
  swaggerHabilitado: process.env.SWAGGER_HABILITADO === 'true',
  siteUrls: obrigatoria('SITE_URL').split(',').map((url) => url.trim().replace(/\/$/, '')),
}
