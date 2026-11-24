import { expect, test } from '@playwright/test'

// Fluxo completo: responder o quiz, deixar os contatos e enviar. Precisa da API no ar (ver playwright.config.ts).
test.describe('diagnóstico ponta a ponta', () => {
  // Os fluxos são longos (6 perguntas e pausa do formulário); o primeiro acesso após reiniciar a API pode demorar mais.
  test.describe.configure({ timeout: 90_000 })

  test('responde o quiz, envia o formulário e vê a confirmação', async ({ page }) => {
    await page.goto('/blog/diagnostico')

    // Quiz: escolhe a segunda opção (1 ponto) em cada uma das 6 perguntas e avança.
    for (let pergunta = 0; pergunta < 6; pergunta++) {
      await page.locator('label.quiz-option').nth(1).click()
      const proxima = page.getByRole('button', { name: /Próxima|Ver resultado/ })
      await proxima.click()
    }

    await page.getByRole('button', { name: 'Deixar meus contatos' }).click()

    // O formulário só aceita envio depois de alguns segundos aberto (proteção contra robôs).
    await page.waitForTimeout(3500)
    await page.locator('#diag-nome').fill('Teste Automatizado')
    await page.locator('#diag-email').fill('teste.e2e@empresa.com.br')
    await page.locator('#diag-empresa').fill('Empresa de Teste')
    await page.locator('#diag-cargo').fill('Analista')
    await page.locator('#diag-telefone').fill('(81) 98888-7777')
    await page.locator('input[name="como_conheceu"][value="blog"]').check({ force: true })
    await page.locator('#diag-consentimento_contato').check({ force: true })
    await page.locator('#diag-problema').fill('Teste automático do fluxo de diagnóstico.')

    await page.getByRole('button', { name: /enviar/i }).click()
    await expect(page.getByRole('heading', { name: 'Recebemos sua solicitação.' })).toBeVisible({ timeout: 15_000 })
  })

  test('não envia o formulário sem os campos obrigatórios', async ({ page }) => {
    await page.goto('/blog/diagnostico')
    for (let pergunta = 0; pergunta < 6; pergunta++) {
      await page.locator('label.quiz-option').nth(0).click()
      await page.getByRole('button', { name: /Próxima|Ver resultado/ }).click()
    }
    await page.getByRole('button', { name: 'Deixar meus contatos' }).click()
    await page.waitForTimeout(3500)
    await page.getByRole('button', { name: /enviar/i }).click()
    await expect(page.getByRole('heading', { name: 'Recebemos sua solicitação.' })).toHaveCount(0)
    await expect(page.locator('#diag-nome')).toBeVisible()
  })
})

test('a newsletter da Home aceita um e-mail', async ({ page }) => {
  await page.goto('/blog')
  const formulario = page.locator('section.newsletter form')
  await formulario.scrollIntoViewIfNeeded()
  await formulario.locator('input[type="email"]').fill('newsletter.e2e@empresa.com.br')
  await formulario.locator('input[type="checkbox"]').check({ force: true })
  await formulario.getByRole('button', { name: 'Assinar newsletter' }).click()
  await expect(page.locator('body')).toContainText(/Obrigado|próxima edição/i, { timeout: 15_000 })
})
