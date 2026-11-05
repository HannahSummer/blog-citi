import { execSync } from 'node:child_process'
import { join } from 'node:path'

// Antes da suíte: aplica as migrações no banco de teste (cria as tabelas se ainda não existirem).
export default function globalSetup() {
  execSync('npx prisma migrate deploy', {
    cwd: join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://citi:citi@localhost:5433/blog_citi_teste' },
    stdio: 'inherit',
  })
}
