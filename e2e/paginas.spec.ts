import { expect, test } from '@playwright/test'

// Cada página principal abre, mostra conteúdo e não lança erro no navegador.
const paginas = [
  { caminho: '/blog', texto: /Ideias que movem/i },
  { caminho: '/blog/artigos', texto: /Ideias para mover decisões/i },
  { caminho: '/blog/artigos/como-aparecer-no-chatgpt', texto: /ChatGPT/i },
  { caminho: '/blog/noticias', texto: /Radar da semana/i },
  { caminho: '/blog/sobre', texto: /Sobre o CITi/i },
  { caminho: '/blog/diagnostico', texto: /Faça seu diagnóstico/i },
]

for (const { caminho, texto } of paginas) {
  test(`abre ${caminho} sem erros`, async ({ page }) => {
    const erros: string[] = []
    page.on('pageerror', (erro) => erros.push(erro.message))
    page.on('console', (mensagem) => { if (mensagem.type() === 'error') erros.push(mensagem.text()) })

    await page.goto(caminho)
    await expect(page.locator('body')).toContainText(texto)
    expect(erros, erros.join('\n')).toEqual([])
  })
}

test('rota inexistente mostra a página de não encontrado', async ({ page }) => {
  await page.goto('/blog/nao-existe-de-jeito-nenhum')
  await expect(page.locator('body')).toContainText(/não encontr|404/i)
})

test('o menu leva às seções principais', async ({ page }) => {
  await page.goto('/blog')
  await page.getByRole('link', { name: 'Blog', exact: true }).first().click()
  await expect(page).toHaveURL(/\/blog\/artigos$|\/blog$/)
  await page.getByRole('link', { name: 'Notícias', exact: true }).first().click()
  await expect(page).toHaveURL(/\/blog\/noticias/)
})

test('a busca encontra um artigo pelo título', async ({ page }) => {
  await page.goto('/blog')
  await page.getByRole('button', { name: 'Abrir busca' }).first().click()
  await page.locator('#site-search').fill('ChatGPT')
  await expect(page.locator('body')).toContainText(/como aparecer no chatgpt/i)
})
