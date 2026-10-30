import { expect, test } from '@playwright/test'

// Painel interno. O login com conta real só roda se as variáveis abaixo estiverem definidas
// (conta de editora criada com `npm run editora` na API do ambiente de teste).
const email = process.env.E2E_EDITORA_EMAIL
const senha = process.env.E2E_EDITORA_SENHA

test('sem login, o painel pede a entrada e não mostra nada interno', async ({ page }) => {
  await page.goto('/blog/admin/noticias')
  await expect(page.locator('form.admin-login')).toBeVisible()
  await expect(page.locator('.admin-nav')).toHaveCount(0)
})

test('senha errada mostra a mensagem genérica', async ({ page }) => {
  await page.goto('/blog/admin/noticias')
  await page.locator('input[type="email"]').fill('ninguem@citi.org.br')
  await page.locator('input[type="password"]').fill('senha-errada-qualquer')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('alert')).toHaveText('E-mail ou senha incorretos.')
})

test('a página do painel não é indexada', async ({ page }) => {
  await page.goto('/blog/admin/leads')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
})

test.describe('com conta de editora', () => {
  test.skip(!email || !senha, 'Defina E2E_EDITORA_EMAIL e E2E_EDITORA_SENHA para testar o login real.')

  test('entra, vê as abas e alterna entre notícias e leads', async ({ page }) => {
    await page.goto('/blog/admin/noticias')
    await page.locator('input[type="email"]').fill(email!)
    await page.locator('input[type="password"]').fill(senha!)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.locator('.admin-nav')).toBeVisible()
    await expect(page.getByRole('tab', { name: /Para revisar/ })).toBeVisible()

    const secoes = page.getByRole('navigation', { name: 'Seções do painel' })
    await secoes.getByRole('link', { name: 'Leads e newsletter' }).click()
    await expect(page).toHaveURL(/\/blog\/admin\/leads/)
    await expect(page.getByRole('button', { name: /Leads \(CSV\)/ })).toBeVisible()

    await secoes.getByRole('link', { name: 'Notícias' }).click()
    await expect(page).toHaveURL(/\/blog\/admin\/noticias/)
  })

  test('sair volta para a tela de login', async ({ page }) => {
    await page.goto('/blog/admin/noticias')
    await page.locator('input[type="email"]').fill(email!)
    await page.locator('input[type="password"]').fill(senha!)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.locator('.admin-nav')).toBeVisible()
    await page.getByRole('button', { name: /Sair/ }).click()
    await expect(page.locator('form.admin-login')).toBeVisible()
  })
})
