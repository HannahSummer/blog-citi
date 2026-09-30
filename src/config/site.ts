export const siteConfig = {
  name: 'Blog CITi',
  linkedin: 'https://www.linkedin.com/company/citi-ufpe/',
  menu: [
    { label: 'Nossa Metodologia', href: '/blog#metodologia' },
    { label: 'Blog', href: '/blog/artigos' },
    { label: 'Notícias', href: '/blog/noticias' },
    { label: 'Sobre', href: '/blog#sobre' },
  ],
  hero: {
    eyebrow: 'BLOG DO CITi',
    title: 'Ideias que movem',
    emphasis: 'negócios.',
    description: 'Tecnologia, design e estratégia para transformar boas perguntas em próximos passos.',
  },
  methodology: {
    eyebrow: 'Nossa Metodologia',
    title: 'Começamos pelo problema. Depois, a tecnologia.',
    description: 'O blog do CITi existe para aprofundar problemas reais de negócio e mostrar caminhos para resolvê-los com tecnologia, sem buzzwords.',
    cards: [
      ['Ponto de partida', 'O problema de negócio', 'Todo conteúdo nasce de uma dor real de empresas, não de uma tendência.'],
      ['Construção', 'Insight e caminho', 'Mostramos como pensar a solução, do Discovery à entrega.'],
      ['Continuidade', 'O seu próximo passo', 'Leitura, newsletter ou uma conversa com o nosso time.'],
    ],
  },
  about: {
    eyebrow: 'Sobre o CITi',
    title: 'Somos o time que entende antes de construir.',
    description: 'Uma empresa júnior de tecnologia do CIn-UFPE, B2B, que transforma problemas de negócio em soluções digitais.',
    journey: ['Problema de negócio', 'Discovery', 'Delivery', 'Valor gerado'],
  },
} as const
