// Fonte única do diagnóstico: perguntas, pontuação, níveis, textos e opções do formulário.
// Os `id`s das perguntas e os valores de `nivel` e `como_conheceu` são gravados no banco.
// Ao mudar algum deles, leia docs/05-DIAGNOSTICO-E-LEADS.md antes.

export interface DiagnosticoPergunta {
  id: string
  // Nome curto da dimensão, usado no radar e no resultado.
  dimensao: string
  // Próximo passo sugerido quando a resposta não é a máxima. Validar com a Gerente.
  foco: string
  question: string
  options: Array<{ label: string; points: 0 | 1 | 2 }>
}

export const diagnosticoPerguntas = [
  { id: 'processos', dimensao: 'Processos', foco: 'Registrar como o processo principal funciona hoje.', question: 'Como os processos principais da empresa são registrados?', options: [{ label: 'Não são registrados', points: 0 }, { label: 'Em planilhas ou mensagens', points: 1 }, { label: 'Documentados e revisados', points: 2 }] },
  { id: 'retrabalho', dimensao: 'Retrabalho', foco: 'Mapear onde a equipe repete tarefas e automatizar a mais frequente.', question: 'Quanto do tempo da equipe vai para retrabalho ou tarefas repetidas?', options: [{ label: 'Muito', points: 0 }, { label: 'Algum', points: 1 }, { label: 'Pouco', points: 2 }] },
  { id: 'conhecimento', dimensao: 'Conhecimento', foco: 'Documentar o que hoje depende de uma ou duas pessoas.', question: 'Quem sabe como o processo mais importante funciona?', options: [{ label: 'Uma pessoa só', points: 0 }, { label: 'Algumas pessoas', points: 1 }, { label: 'Está documentado e o time sabe', points: 2 }] },
  { id: 'integracao', dimensao: 'Integração', foco: 'Conectar os dois sistemas que mais trocam informação.', question: 'Os sistemas que a empresa usa conversam entre si?', options: [{ label: 'Não', points: 0 }, { label: 'Parcialmente', points: 1 }, { label: 'Sim', points: 2 }] },
  { id: 'medicao', dimensao: 'Medição', foco: 'Definir um ou dois indicadores para cada projeto digital.', question: 'Você mede o resultado de projetos ou decisões digitais?', options: [{ label: 'Não', points: 0 }, { label: 'Às vezes', points: 1 }, { label: 'Sim, com indicadores', points: 2 }] },
  { id: 'decisao', dimensao: 'Decisão', foco: 'Criar um critério simples para decidir compra ou desenvolvimento de software.', question: 'Quando surge uma necessidade de software, o que acontece?', options: [{ label: 'Compra-se às pressas', points: 0 }, { label: 'Discute-se sem critério', points: 1 }, { label: 'Existe um processo de decisão', points: 2 }] },
] as const satisfies readonly DiagnosticoPergunta[]

export type PerguntaId = (typeof diagnosticoPerguntas)[number]['id']
export type Respostas = Partial<Record<PerguntaId, number>>

export const PONTUACAO_MAXIMA = diagnosticoPerguntas.length * 2

// Faixas de 4 níveis (documento 11). `max` é inclusivo.
// Textos propostos: validar com a Gerente.
export const diagnosticoNiveis = [
  { id: 'inicial', max: 3, label: 'Inicial', description: 'Hoje, a maior parte do trabalho depende de planilhas, mensagens e de poucas pessoas. Isso é comum e tem solução. O primeiro passo é escolher um processo e registrá-lo.' },
  { id: 'organizacao', max: 6, label: 'Em organização', description: 'Já existem processos e alguma organização. O que trava é a falta de integração e de medição. Vale definir um ou dois indicadores e conectar os sistemas que mais se falam.' },
  { id: 'evolucao', max: 9, label: 'Em evolução', description: 'Os processos estão documentados e parte do time conhece o funcionamento. O próximo ganho costuma estar em medir resultados e decidir software com critério.' },
  { id: 'estruturado', max: 12, label: 'Estruturado', description: 'Há processos, indicadores e uma forma de decidir tecnologia. A pergunta agora é o que escalar e qual decisão ainda está em aberto.' },
] as const

export type NivelId = (typeof diagnosticoNiveis)[number]['id']
export type Nivel = (typeof diagnosticoNiveis)[number]

// Único lugar onde a pontuação é calculada.
export function calcularResultado(respostas: Respostas): { pontuacao: number; nivel: NivelId } {
  const pontuacao = diagnosticoPerguntas.reduce((total, pergunta) => {
    const valor = respostas[pergunta.id]
    return total + (valor === 0 || valor === 1 || valor === 2 ? valor : 0)
  }, 0)
  const nivel = diagnosticoNiveis.find((item) => pontuacao <= item.max) ?? diagnosticoNiveis[diagnosticoNiveis.length - 1]
  return { pontuacao, nivel: nivel.id }
}

export function buscarNivel(id: NivelId): Nivel {
  return diagnosticoNiveis.find((item) => item.id === id) ?? diagnosticoNiveis[0]
}

export const comoConheceuOpcoes = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'google', label: 'Google' },
  { value: 'blog', label: 'Blog do CITi' },
  { value: 'evento', label: 'Evento' },
  { value: 'outro', label: 'Outro' },
] as const

export type ComoConheceu = (typeof comoConheceuOpcoes)[number]['value']

// Textos propostos: validar com a Gerente.
// Mudar o texto de consentimento exige nova CONSENTIMENTO_VERSAO em services/leads.ts.
export const diagnosticoTextos = {
  eyebrow: 'Faça seu diagnóstico',
  titulo: 'Entenda onde sua empresa',
  tituloDestaque: 'está.',
  subtitulo: 'Seis perguntas rápidas sobre processos, sistemas e decisões digitais. O resultado aparece na hora, e nada é enviado sem a sua autorização.',
  comoFuncionaTitulo: 'Como funciona',
  passos: [
    'Você responde uma pergunta por vez.',
    'A soma mostra em que nível sua empresa está hoje.',
    'Se quiser, deixa seus contatos para receber o resultado completo e conversar com o CITi.',
  ],
  resultadoEyebrow: 'Seu resultado',
  chamadaFormularioTitulo: 'Quer o resultado completo e uma conversa com o CITi?',
  chamadaFormularioTexto: 'Deixe seus contatos.',
  botaoFormulario: 'Deixar meus contatos',
  botaoContato: 'Falar com o CITi',
  refazer: 'Refazer o diagnóstico',
  formularioTitulo: 'Receba o resultado completo',
  consentimentoContato: 'Autorizo o CITi a entrar em contato sobre esta solicitação.',
  newsletter: 'Quero receber a newsletter do CITi (em breve).',
  privacidade: 'Seus dados serão usados apenas para responder à sua solicitação.',
  problemaPlaceholder: 'Conte o contexto, o que está travando e o que você espera resolver.',
  dicaEmailPessoal: 'Se tiver, prefira o e-mail da empresa.',
  confirmacaoTitulo: 'Recebemos sua solicitação.',
  confirmacaoTexto: 'Alguém do CITi vai ler o que você escreveu e responder pelo e-mail informado.',
  confirmacaoLink: 'Enquanto isso, leia nossos artigos',
  erroEnvio: 'Não conseguimos enviar agora. Seus dados continuam aqui; tente de novo em instantes.',
} as const

// TODO: criar a rota /privacidade e trocar para '/privacidade'.
export const politicaPrivacidadeUrl = ''
