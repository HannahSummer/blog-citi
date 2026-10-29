/**
 * Pede ao Claude a copy de cada candidato: título, resumo e "por que importa",
 * já no formato da página de notícias. Também decide se o item é relevante para o ICP.
 *
 * Precisa de ANTHROPIC_API_KEY no ambiente (GitHub Secrets no Actions; nunca no código).
 * O texto gerado é um rascunho: só vai ao ar depois da aprovação no painel.
 */
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { CATEGORIAS, CONTINENTES, MODELO_REDACAO, SUBTEMAS, type Categoria, type Continente, type Subtema } from './config'
import type { Candidato } from './tipos'
import { dataISO } from './texto'

export interface Redacao {
  relevante: boolean
  motivo: string
  titulo: string
  resumo: string
  por_que_importa: string
  categoria: Categoria
  subtema: Subtema | null
  continente: Continente | null
}

const Schema = z.object({
  relevante: z.boolean().describe('true só se a notícia revela um problema, mudança ou oportunidade para empresas do ICP do CITi'),
  motivo: z.string().describe('Uma frase para quem revisa: por que escolher (ou descartar) este item'),
  titulo: z.string().describe('Título reescrito, informativo, sem sensacionalismo, até 110 caracteres'),
  resumo: z.string().describe('2 a 3 frases com palavras próprias, entre 120 e 420 caracteres'),
  por_que_importa: z.string().describe('Um parágrafo curto com o olhar do CITi, entre 150 e 600 caracteres'),
  categoria: z.enum(CATEGORIAS as [Categoria, ...Categoria[]]),
  subtema: z.enum([...SUBTEMAS, 'nenhum']).describe('Use "nenhum" quando nenhum subtema se aplica'),
  continente: z.enum([...CONTINENTES, 'nenhum']).describe('Continente onde o fato acontece; "nenhum" se for global ou indefinido'),
})

// Fixo (sem data nem variáveis) para aproveitar o cache de prompt entre as chamadas.
const SISTEMA = `Você é editor do "Radar da semana", a seção de notícias do blog do CITi, empresa júnior de tecnologia B2B da UFPE (Recife). O CITi desenvolve software sob medida, automação de processos e MVPs, e sempre começa pelo problema de negócio, não pela tecnologia.

Público (ICP): gestores e donos de pequenas e médias empresas que estão digitalizando processos, startups buscando validar um MVP e empreendedores com uma necessidade específica de software. Notícias do ecossistema de Recife e do Porto Digital têm prioridade.

Para cada notícia você recebe título, fonte, data e um trecho curto do feed RSS. Escreva a copy que vai ao site:

- titulo: reescreva com suas palavras, claro e informativo, em português do Brasil. Sem clickbait, sem ponto final.
- resumo: 2 a 3 frases que explicam o fato. Use apenas informações presentes no título e no trecho; não invente números, nomes ou datas. Nunca copie frases da fonte.
- por_que_importa: um parágrafo que responde "por que isso importa para uma empresa como a sua?". Diga qual problema, mudança ou oportunidade a notícia revela, para quem ela importa e qual pergunta a empresa deveria se fazer. Tom direto e prático, sem jargão, sem vender serviços do CITi e sem chamada para ação.
- categoria: negocios (marketing, vendas, crescimento, mercado), solucoes (como problemas viram soluções digitais: dados, desenvolvimento, IA e inovação, experiência do cliente) ou gestao (gestão empresarial, processos, finanças, movimentos das big techs).
- subtema: com negocios, marketing ou vendas; com solucoes, dados, desenvolvimento, inovacao ou experiencia-do-cliente; com gestao, gestao-empresarial, big-techs (anúncios e movimentos de grandes empresas de tecnologia) ou financas; nenhum se nenhum se aplica.
- continente: onde o fato acontece (america-do-sul, america-do-norte, europa, africa, asia ou oceania); nenhum se for global ou não der para saber pelo trecho.
- relevante: false para política partidária, mercado financeiro do dia a dia (cotações, ações), tecnologia de consumo sem impacto em empresas, celebridades, promoções, press release disfarçado ou quando o trecho é vago demais para escrever um resumo fiel. Mesmo com relevante=false, preencha os outros campos.
- motivo: uma frase para a pessoa de marketing que vai revisar.

Escreva em português do Brasil, com acentuação correta.`

export function clienteClaude(): Anthropic | null {
  return process.env.ANTHROPIC_API_KEY ? new Anthropic() : null
}

export async function redigir(cliente: Anthropic, c: Candidato): Promise<Redacao | null> {
  const entrada = [
    `Título original: ${c.titulo}`,
    `Fonte: ${c.fonte}`,
    `Data: ${c.data ? dataISO(new Date(c.data)) : 'sem data'}`,
    `Trecho do feed: ${c.resumo || '(vazio)'}`,
    `Categoria sugerida pelo radar: ${c.categoriaSugerida}`,
  ].join('\n')

  const resposta = await cliente.messages.parse({
    model: MODELO_REDACAO,
    max_tokens: 16000,
    output_config: { effort: 'medium', format: zodOutputFormat(Schema) },
    system: [{ type: 'text', text: SISTEMA, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: entrada }],
  })

  if (resposta.stop_reason === 'refusal' || !resposta.parsed_output) {
    console.warn(`[redigir] sem copy para "${c.titulo}" (${resposta.stop_reason})`)
    return null
  }
  const { subtema, continente, ...resto } = resposta.parsed_output
  return { ...resto, subtema: subtema === 'nenhum' ? null : subtema, continente: continente === 'nenhum' ? null : continente }
}
