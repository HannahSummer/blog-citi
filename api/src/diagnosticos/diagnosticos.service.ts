import { BadRequestException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { curto, ehObjeto, texto, type Corpo } from '../comum/texto'
// Regras compartilhadas com o formulário do site: uma mudança vale para os dois lados.
import { calcularResultado, diagnosticoPerguntas, type Respostas } from '../../../src/config/diagnostico'
import { respostasValidas, somenteDigitos, validarCampos, type DiagnosticoCampos } from '../../../src/lib/diagnostico-schema'

@Injectable()
export class DiagnosticosService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(corpo: unknown) {
    if (!ehObjeto(corpo)) throw new BadRequestException({ erro: 'Envio inválido.' })
    const campos: DiagnosticoCampos = {
      nome: texto(corpo.nome),
      email: texto(corpo.email),
      empresa: texto(corpo.empresa),
      cargo: texto(corpo.cargo),
      telefone: texto(corpo.telefone),
      como_conheceu: texto(corpo.como_conheceu),
      problema: texto(corpo.problema),
      consentimento_contato: corpo.consentimento_contato === true,
      newsletter_optin: corpo.newsletter_optin === true,
    }
    const respostasRecebidas = (ehObjeto(corpo.respostas) ? corpo.respostas : {}) as Respostas
    // Mesma validação do formulário: nada é gravado sem consentimento ou com respostas incompletas.
    const erros = validarCampos(campos)
    if (Object.keys(erros).length > 0 || !respostasValidas(respostasRecebidas)) throw new BadRequestException({ erro: 'Revise os campos destacados.', campos: erros })
    const versao = texto(corpo.consentimento_versao)
    if (!versao || versao.length > 60) throw new BadRequestException({ erro: 'Versão do consentimento ausente.' })

    // Grava só os ids conhecidos; pontuação e nível são sempre recalculados aqui, nunca vêm do navegador.
    const respostas = Object.fromEntries(diagnosticoPerguntas.map((pergunta) => [pergunta.id, respostasRecebidas[pergunta.id]]))
    const { pontuacao, nivel } = calcularResultado(respostasRecebidas)
    const utm: Corpo = ehObjeto(corpo.utm) ? corpo.utm : {}
    const email = campos.email.toLowerCase()

    await this.prisma.$transaction(async (tx) => {
      await tx.diagnostico.create({
        data: {
          nome: campos.nome,
          email,
          empresa: campos.empresa,
          cargo: campos.cargo,
          telefone: somenteDigitos(campos.telefone),
          como_conheceu: campos.como_conheceu,
          problema: campos.problema || null,
          respostas: respostas as Prisma.InputJsonObject,
          pontuacao,
          nivel,
          consentimento_contato: true,
          newsletter_optin: campos.newsletter_optin,
          consentimento_versao: versao,
          origem: curto(corpo.origem),
          pagina_referencia: curto(corpo.pagina_referencia, 500),
          utm_source: curto(utm.utm_source),
          utm_medium: curto(utm.utm_medium),
          utm_campaign: curto(utm.utm_campaign),
          utm_content: curto(utm.utm_content),
        },
      })
      // Quem marcou "quero receber a newsletter" entra na lista (e-mail repetido é ignorado).
      if (campos.newsletter_optin) await tx.newsletterInscricao.createMany({ data: [{ email, origem: 'diagnostico', consentimento_versao: versao }], skipDuplicates: true })
    })
  }
}
