/**
 * Cadastro das editoras do painel de notícias.
 *
 *   npm run editora -- criar     nome@citi.org.br "senha com 12+ caracteres"
 *   npm run editora -- senha     nome@citi.org.br "nova senha"
 *   npm run editora -- desativar nome@citi.org.br
 *   npm run editora -- listar
 *
 * Em produção (Coolify), rode no terminal do serviço da API. Precisa de DATABASE_URL.
 * No seu computador, rode `npm run build` antes.
 */
import { PrismaClient } from '@prisma/client'
import { EMAIL_REGEX } from '../../../src/lib/diagnostico-schema'
import { gerarHash, SENHA_MINIMA } from '../auth/senha'

async function main() {
  const [acao, emailBruto, senha] = process.argv.slice(2)
  const email = emailBruto?.trim().toLowerCase() ?? ''
  const prisma = new PrismaClient()
  try {
    if (acao === 'listar') {
      const editoras = await prisma.editora.findMany({ orderBy: { criado_em: 'asc' }, select: { email: true, ativo: true, criado_em: true } })
      editoras.forEach((e) => console.log(`${e.ativo ? 'ativa     ' : 'desativada'}  ${e.email}  (desde ${e.criado_em.toISOString().slice(0, 10)})`))
      if (!editoras.length) console.log('Nenhuma editora cadastrada.')
      return
    }
    if (!['criar', 'senha', 'desativar'].includes(acao)) throw new Error('Ação desconhecida. Use: criar, senha, desativar ou listar.')
    if (!EMAIL_REGEX.test(email)) throw new Error('Informe um e-mail válido.')
    if (acao === 'desativar') {
      await prisma.editora.update({ where: { email }, data: { ativo: false } })
      console.log(`${email} não entra mais no painel.`)
      return
    }
    if (!senha || senha.length < SENHA_MINIMA) throw new Error(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`)
    const senha_hash = await gerarHash(senha)
    if (acao === 'criar') {
      await prisma.editora.create({ data: { email, senha_hash } })
      console.log(`Editora ${email} cadastrada. Ela já pode entrar em /blog/admin/noticias.`)
    } else {
      await prisma.editora.update({ where: { email }, data: { senha_hash, ativo: true } })
      console.log(`Senha de ${email} trocada (e conta reativada).`)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((erro: Error) => { console.error(`Erro: ${erro.message}`); process.exit(1) })
