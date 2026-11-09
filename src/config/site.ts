export const siteConfig = {
  name: 'Blog CITi',
  // Liga sozinho quando VITE_API_URL (endereço da API) está definida.
  diagnosticoComBanco: Boolean(import.meta.env.VITE_API_URL),
  // Em `npm run dev` sem .env, o formulário aparece e o envio é simulado (modo demonstração).
  diagnosticoModoDemonstracao: import.meta.env.DEV && !import.meta.env.VITE_API_URL,
  ctaContatoUrl: '',
  linkedin: 'https://www.linkedin.com/company/citiufpe/',
  instagram: 'https://www.instagram.com/citiufpe/',
  menu: [
    { label: 'Nosso jeito', href: '/blog#metodologia' },
    { label: 'Blog', href: '/blog/artigos' },
    { label: 'Notícias', href: '/blog/noticias' },
    { label: 'Sobre o CITi', href: '/blog/sobre' },
  ],
  hero: {
    eyebrow: 'Blog do CITi · CIn-UFPE',
    title: 'Ideias que movem',
    emphasis: 'negócios.',
    description: 'Artigos, notícias e bastidores de quem transforma problemas de negócio em soluções digitais desde 1995.',
  },
  home: {
    featuredEyebrow: 'Em destaque',
    featuredTitle: 'Para ler no seu',
    featuredEmphasis: 'próximo intervalo.',
    themesEyebrow: 'Explore por tema',
    themesTitle: 'Escolha o problema.',
    themesEmphasis: 'A gente explica o caminho.',
  },
  methodology: {
    eyebrow: 'Nosso jeito',
    title: 'Começamos pelo problema. Depois, a tecnologia.',
    description: 'Cada conteúdo do blog parte de um problema real de empresa e mostra como resolvê-lo com tecnologia, com exemplos, números e sem jargão.',
    cards: [
      ['Ponto de partida', 'O problema de negócio', 'Todo conteúdo começa por uma dor real de empresa, não pela tendência da semana.'],
      ['Construção', 'O caminho até a solução', 'Mostramos como pensar a resposta, do Discovery à entrega, com exemplos práticos.'],
      ['Continuidade', 'A sua próxima decisão', 'Ler, assinar a newsletter ou conversar com o nosso time sobre o seu caso.'],
    ],
  },
  about: {
    eyebrow: 'Sobre o CITi',
    title: 'Somos o time que entende antes de construir.',
    description: 'Uma empresa júnior de tecnologia do CIn-UFPE, B2B, que transforma problemas de negócio em soluções digitais.',
    journey: ['Problema de negócio', 'Discovery', 'Delivery', 'Valor gerado'],
    teamPhoto: '/images/sobre/equipe.webp',
  },
} as const
