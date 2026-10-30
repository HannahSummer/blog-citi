import { defineConfig } from 'vitest/config'

// Testes do site: regras compartilhadas com a API e conteúdo em Markdown. Rode com `npm run test`.
// Os testes de integração da API ficam em api/ (npm run api:test).
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
