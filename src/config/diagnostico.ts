export interface DiagnosticoPergunta {
  id: string
  question: string
  options: Array<{ label: string; points: number }>
}

export const diagnosticoPerguntas: DiagnosticoPergunta[] = [
  { id: 'processos', question: 'Como os processos principais da empresa são registrados?', options: [{ label: 'Não são registrados', points: 0 }, { label: 'Em planilhas ou mensagens', points: 1 }, { label: 'Documentados e revisados', points: 2 }] },
  { id: 'retrabalho', question: 'Quanto do tempo da equipe vai para retrabalho ou tarefas repetidas?', options: [{ label: 'Muito', points: 0 }, { label: 'Algum', points: 1 }, { label: 'Pouco', points: 2 }] },
  { id: 'conhecimento', question: 'Quem sabe como o processo mais importante funciona?', options: [{ label: 'Uma pessoa só', points: 0 }, { label: 'Algumas pessoas', points: 1 }, { label: 'Está documentado e o time sabe', points: 2 }] },
  { id: 'sistemas', question: 'Os sistemas que a empresa usa conversam entre si?', options: [{ label: 'Não', points: 0 }, { label: 'Parcialmente', points: 1 }, { label: 'Sim', points: 2 }] },
  { id: 'indicadores', question: 'Você mede o resultado de projetos ou decisões digitais?', options: [{ label: 'Não', points: 0 }, { label: 'Às vezes', points: 1 }, { label: 'Sim, com indicadores', points: 2 }] },
  { id: 'software', question: 'Quando surge uma necessidade de software, o que acontece?', options: [{ label: 'Compra-se às pressas', points: 0 }, { label: 'Discute-se sem critério', points: 1 }, { label: 'Existe um processo de decisão', points: 2 }] },
]

export const diagnosticoResultados = {
  comecando: { label: 'Começando', description: 'É um bom momento para organizar o básico antes de acelerar. Estes três primeiros passos ajudam a criar clareza.', steps: ['Escolha um processo importante e registre como ele funciona hoje.', 'Identifique onde o retrabalho mais consome tempo da equipe.', 'Defina um indicador simples para acompanhar a melhoria.'] },
  evolucao: { label: 'Em evolução', description: 'Há práticas funcionando, mas alguns pontos ainda travam o ritmo. O próximo ganho vem de conectar o que já existe.', steps: ['Revise os processos que dependem de conhecimento concentrado.', 'Priorize uma integração que reduza trabalho manual.', 'Conecte cada projeto digital a um indicador de resultado.'] },
  estruturado: { label: 'Estruturado', description: 'A base está organizada para escalar. A decisão agora é transformar essa capacidade em aprendizado contínuo e resultados maiores.', steps: ['Escolha o processo com maior potencial de escala.', 'Torne os indicadores parte das decisões de produto e operação.', 'Registre qual decisão de software ainda precisa de evidência.'] },
} as const