import { defineConfig, devices } from '@playwright/test'

// Testes de navegador (fluxos reais do site). Precisam do ambiente no ar:
//   docker compose up -d --build   (site em :5173 e API em :3000)
// e rodam com o Chrome instalado na máquina (não baixa navegador extra).
//   npm run test:e2e
// Para outro endereço: E2E_BASE_URL=https://blog.citi.org.br npm run test:e2e
export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
})
