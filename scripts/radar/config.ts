/**
 * Radar de notícias do Blog do CITi — configuração.
 *
 * Tudo que o time de marketing precisa ajustar fica AQUI:
 * fontes, palavras-chave por categoria, termos a ignorar e pesos.
 * Não é preciso mexer nos outros arquivos para mudar o que o radar procura.
 */

export type Categoria = 'negocios' | 'solucoes' | 'inovacao' | 'institucional' | 'gestao'

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
  { nome: 'Movimento Econômico', url: 'https://movimentoeconomico.com.br/feed/', peso: 2, verificada: false, ativa: true },
  { nome: 'Diario de Pernambuco — Economia', url: 'https://www.diariodepernambuco.com.br/rss/economia.xml', peso: 2, verificada: false, ativa: true },

  // Tecnologia B2B e negócios
  { nome: 'IT Forum', url: 'https://itforum.com.br/feed/', peso: 1, verificada: false, ativa: true },
  { nome: 'TI Inside', url: 'https://tiinside.com.br/feed/', peso: 1, verificada: false, ativa: true },
  { nome: 'Startupi', url: 'https://startupi.com.br/feed/', peso: 1, verificada: false, ativa: true },
  { nome: 'Canaltech — Mercado', url: 'https://canaltech.com.br/rss/', peso: 1, verificada: false, ativa: true },

  // Busca por tema no Google Notícias (útil para cobrir veículos sem RSS).
  // Confira os termos de uso antes de usar em produção; os links vêm como redirecionamento do Google.
  { nome: 'Google Notícias — Porto Digital', url: googleNews('"Porto Digital"'), peso: 2, verificada: false, ativa: true },
  { nome: 'Google Notícias — IA nas empresas', url: googleNews('"inteligência artificial" empresas pesquisa'), peso: 1, verificada: false, ativa: true },
  { nome: 'Google Notícias — transformação digital PMEs', url: googleNews('"transformação digital" OR digitalização pequenas médias empresas'), peso: 1, verificada: false, ativa: true },
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
  negocios: ['crescimento', 'faturamento', 'investimento', 'mercado', 'estrategia', 'competitividade', 'receita', 'expansao', 'pme', 'pequenas empresas', 'medias empresas'],
  solucoes: ['software', 'plataforma', 'aplicativo', 'sistema', 'automacao', 'mvp', 'produto digital', 'dados', 'integracao', 'legado', 'nuvem', 'desenvolvimento'],
  inovacao: ['inteligencia artificial', ' ia ', 'ia generativa', 'agentes', 'inovacao', 'startup', 'tendencia', 'pesquisa aponta', 'estudo'],
  institucional: ['empresa junior', 'ufpe', 'cin', 'universidade', 'porto digital', 'recife', 'pernambuco', 'rec\'n\'play', 'residencia tecnologica'],
  gestao: ['processo', 'produtividade', 'eficiencia', 'gestao', 'operacao', 'retrabalho', 'custo', 'lideranca', 'governanca', 'roi', 'retorno'],
}

/** Termos que, se aparecerem no título, eliminam o item (fofoca, política partidária, esportes etc.). */
export const TERMOS_BLOQUEADOS = [
  'bbb', 'novela', 'futebol', 'campeonato', 'eleicao', 'candidato', 'horoscopo', 'celebridade', 'cupom', 'promocao', 'black friday', 'loteria',
]

/** Bônus por recência: itens das últimas 48h ganham pontos extras. */
export const BONUS_RECENTE = 1
