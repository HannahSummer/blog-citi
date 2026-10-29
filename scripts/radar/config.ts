/**
 * Radar de notícias do Blog do CITi — configuração.
 *
 * Tudo que o time de marketing precisa ajustar fica AQUI:
 * fontes, palavras-chave por categoria, termos a ignorar e pesos.
 * Não é preciso mexer nos outros arquivos para mudar o que o radar procura.
 */

export type Categoria = 'negocios' | 'solucoes' | 'gestao'
export const CATEGORIAS: Categoria[] = ['negocios', 'solucoes', 'gestao']

/** Mesmos slugs de src/data/subtemas.ts e do check da tabela `noticias`. */
export const SUBTEMAS = ['marketing', 'vendas', 'dados', 'desenvolvimento', 'inovacao', 'experiencia-do-cliente', 'gestao-empresarial', 'big-techs', 'financas'] as const
export type Subtema = (typeof SUBTEMAS)[number]

export interface Fonte {
  /** Nome exibido no relatório e usado no campo `fonte` da notícia. */
  nome: string
  /** URL do feed RSS/Atom. */
  url: string
  /** 1 = fonte comum, 2 = fonte muito alinhada ao ICP (ecossistema local, pesquisas). */
  peso: 1 | 2
  /** Marque true depois de rodar `npm run radar -- --checar-fontes` e confirmar que o feed responde. */
  verificada: boolean
  ativa: boolean
}

/** Janela de busca, em dias. */
export const JANELA_DIAS = 7

/** Quantos candidatos entram no relatório (os de maior pontuação). */
export const MAX_CANDIDATOS = 25

/** Pontuação mínima para um item entrar no relatório. */
export const PONTUACAO_MINIMA = 3

/** Quantos candidatos do topo do relatório vão para o Claude escrever a copy. */
// Mesmos slugs de src/data/continentes.ts (globo da página de notícias).
export const CONTINENTES = ['america-do-sul', 'america-do-norte', 'europa', 'africa', 'asia', 'oceania'] as const
export type Continente = (typeof CONTINENTES)[number]

export const MAX_PARA_REDACAO = 12

/** Quantas sugestões, no máximo, chegam ao painel por semana. */
export const MAX_SUGESTOES_SEMANA = 6

/** Modelo que escreve a copy. */
export const MODELO_REDACAO = 'claude-opus-5-5'

/** Pastas de saída (relativas à raiz do repositório). */
export const PASTA_RELATORIOS = 'radar/relatorios'
export const PASTA_RASCUNHOS = 'radar/rascunhos'
export const PASTA_NOTICIAS = 'src/content/noticias'

/**
 * Fontes. Prefira sempre o RSS oficial do veículo.
 * URLs com `verificada: false` foram inferidas (padrão /feed/ de WordPress)
 * e precisam ser confirmadas com `npm run radar -- --checar-fontes`.
 */
export const FONTES: Fonte[] = [
  // Ecossistema local (Recife / Pernambuco)
  { nome: 'Movimento Econômico', url: 'https://movimentoeconomico.com.br/feed/', peso: 2, verificada: true, ativa: true },
  { nome: 'Porto Digital', url: 'https://www.portodigital.org/feed', peso: 2, verificada: true, ativa: true },
  { nome: 'Google Notícias — Porto Digital', url: googleNews('"Porto Digital"'), peso: 2, verificada: true, ativa: true },
  { nome: 'Google Notícias — tecnologia em Pernambuco', url: googleNews('Recife OR Pernambuco tecnologia empresas'), peso: 2, verificada: true, ativa: true },
  // Bloqueia o radar (403). Fica desativada até achar um feed que responda.
  { nome: 'Diario de Pernambuco — Economia', url: 'https://www.diariodepernambuco.com.br/rss/economia.xml', peso: 2, verificada: false, ativa: false },

  // Fontes primárias: pesquisas e órgãos oficiais
  { nome: 'Agência Sebrae', url: 'https://agenciasebrae.com.br/feed/', peso: 2, verificada: true, ativa: true },
  { nome: 'Agência Brasil — Economia', url: 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml', peso: 1, verificada: true, ativa: true },
  // Cetic.br e IBGE não têm RSS acessível; a busca cobre as pesquisas deles.
  { nome: 'Google Notícias — pesquisas TIC e IBGE', url: googleNews('"Cetic.br" OR "TIC Empresas" OR (IBGE pesquisa empresas tecnologia)'), peso: 2, verificada: true, ativa: true },

  // Soluções e inovação: tecnologia B2B
  { nome: 'TI Inside', url: 'https://tiinside.com.br/feed/', peso: 1, verificada: true, ativa: true },
  { nome: 'Baguete', url: 'https://www.baguete.com.br/rss/noticias/feed', peso: 1, verificada: true, ativa: true },
  { nome: 'MIT Technology Review Brasil', url: 'https://mittechreview.com.br/feed/', peso: 1, verificada: true, ativa: true },
  { nome: 'Mobile Time', url: 'https://www.mobiletime.com.br/feed/', peso: 1, verificada: true, ativa: true },
  { nome: 'Startupi', url: 'https://startupi.com.br/feed/', peso: 1, verificada: true, ativa: true },
  { nome: 'Startups.com.br', url: 'https://startups.com.br/feed/', peso: 1, verificada: true, ativa: true },
  { nome: 'Canaltech — Mercado', url: 'https://canaltech.com.br/rss/', peso: 1, verificada: true, ativa: true },
  { nome: 'Google Notícias — IA nas empresas', url: googleNews('"inteligência artificial" empresas pesquisa'), peso: 1, verificada: true, ativa: true },
  { nome: 'Google Notícias — transformação digital PMEs', url: googleNews('"transformação digital" OR digitalização pequenas médias empresas'), peso: 1, verificada: true, ativa: true },
  { nome: 'Google Notícias — sistemas legados', url: googleNews('"sistemas legados" OR "modernização de sistemas" empresas'), peso: 1, verificada: true, ativa: true },
  // Bloqueia o radar (403).
  { nome: 'IT Forum', url: 'https://itforum.com.br/feed/', peso: 1, verificada: false, ativa: false },

  // Negócios, gestão e financeiro
  { nome: 'MIT Sloan Review Brasil', url: 'https://mitsloanreview.com.br/feed/', peso: 2, verificada: true, ativa: true },
  { nome: 'Exame', url: 'https://exame.com/feed/', peso: 1, verificada: true, ativa: true },
  { nome: 'NeoFeed', url: 'https://neofeed.com.br/feed/', peso: 1, verificada: true, ativa: true },
  { nome: 'InfoMoney', url: 'https://www.infomoney.com.br/feed/', peso: 1, verificada: true, ativa: true },
  { nome: 'Contábeis', url: 'https://www.contabeis.com.br/rss/noticias/', peso: 1, verificada: true, ativa: true },

  // Marketing e comercial
  { nome: 'Meio & Mensagem', url: 'https://www.meioemensagem.com.br/feed', peso: 1, verificada: true, ativa: true },
  { nome: 'Propmark', url: 'https://propmark.com.br/feed/', peso: 1, verificada: true, ativa: true },
  { nome: 'Consumidor Moderno', url: 'https://consumidormoderno.com.br/feed/', peso: 1, verificada: true, ativa: true },
]

function googleNews(consulta: string): string {
  const q = encodeURIComponent(`${consulta} when:${JANELA_DIAS}d`)
  return `https://news.google.com/rss/search?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-419`
}

/**
 * Palavras-chave por categoria. Cada ocorrência no título vale 2 pontos, no resumo vale 1.
 * Use minúsculas e sem acento (o radar normaliza o texto antes de comparar).
 */
export const PALAVRAS_POR_CATEGORIA: Record<Categoria, string[]> = {
  negocios: ['crescimento', 'faturamento', 'investimento', 'mercado', 'estrategia', 'competitividade', 'receita', 'expansao', 'pme', 'pequenas empresas', 'medias empresas', 'marketing', 'vendas', 'comercial', 'crm', 'b2b', 'experiencia do cliente', 'porto digital', 'recife', 'pernambuco'],
  solucoes: ['software', 'plataforma', 'aplicativo', 'sistema', 'automacao', 'mvp', 'produto digital', 'dados', 'integracao', 'legado', 'nuvem', 'desenvolvimento', 'inteligencia artificial', ' ia ', 'ia generativa', 'agentes', 'inovacao', 'startup', 'tendencia', 'pesquisa aponta', 'estudo'],
  gestao: ['processo', 'produtividade', 'eficiencia', 'gestao', 'operacao', 'retrabalho', 'custo', 'lideranca', 'governanca', 'roi', 'retorno', 'financeiro', 'fluxo de caixa', 'credito', 'reforma tributaria', 'tributario', 'nota fiscal', 'erp'],
}

/** Termos que, se aparecerem no título, eliminam o item (fofoca, política partidária, esportes etc.). */
export const TERMOS_BLOQUEADOS = [
  'bbb', 'novela', 'futebol', 'campeonato', 'eleicao', 'candidato', 'horoscopo', 'celebridade', 'cupom', 'promocao', 'black friday', 'loteria',
]

/** Bônus por recência: itens das últimas 48h ganham pontos extras. */
export const BONUS_RECENTE = 1
