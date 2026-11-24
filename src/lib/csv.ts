// Gera e baixa um CSV que abre direto no Excel em português (separador ";" e acentos preservados).
export function baixarCsv(nomeArquivo: string, linhas: Array<Record<string, string | number | boolean | null | undefined>>) {
  if (!linhas.length) return
  const colunas = Object.keys(linhas[0])
  const celula = (valor: unknown) => `"${String(valor ?? '').replace(/"/g, '""')}"`
  const conteudo = [colunas.join(';'), ...linhas.map((linha) => colunas.map((coluna) => celula(linha[coluna])).join(';'))].join('\r\n')
  const url = URL.createObjectURL(new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: nomeArquivo })
  link.click()
  URL.revokeObjectURL(url)
}
