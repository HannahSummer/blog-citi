import { diagnosticoPerguntas, type Respostas } from '../../config/diagnostico'

const TAMANHO = 320
const CENTRO = TAMANHO / 2
const RAIO = 112
const total = diagnosticoPerguntas.length

// Ângulo de cada eixo, começando no topo e girando no sentido horário.
const angulo = (index: number) => (Math.PI * 2 * index) / total - Math.PI / 2
const ponto = (index: number, fracao: number) => [CENTRO + Math.cos(angulo(index)) * RAIO * fracao, CENTRO + Math.sin(angulo(index)) * RAIO * fracao] as const
const caminho = (fracoes: number[]) => `M${fracoes.map((fracao, index) => ponto(index, fracao).map((n) => n.toFixed(1)).join(' ')).join(' L')} Z`

interface DiagnosticoRadarProps {
  respostas: Respostas
  // Pergunta em destaque; `null` quando o quiz terminou.
  atual: number | null
  // Até qual pergunta a pessoa pode voltar pelo radar.
  liberadas: number
  onIrPara?: (index: number) => void
}

export function DiagnosticoRadar({ respostas, atual, liberadas, onIrPara }: DiagnosticoRadarProps) {
  // Eixo sem resposta fica num mínimo, para o desenho não sumir no centro.
  const fracoes = diagnosticoPerguntas.map((pergunta) => {
    const valor = respostas[pergunta.id]
    return valor === undefined ? 0.06 : Math.max(0.06, valor / 2)
  })
  const respondidas = diagnosticoPerguntas.filter((pergunta) => respostas[pergunta.id] !== undefined).length

  return <figure className="radar">
    <div className="radar-figure">
      <svg viewBox={`0 0 ${TAMANHO} ${TAMANHO}`} aria-hidden="true">
        <defs>
          <radialGradient id="radar-preenchimento" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00db59" stopOpacity=".05" />
            <stop offset="100%" stopColor="#00db59" stopOpacity=".38" />
          </radialGradient>
        </defs>
        {[1, 0.5].map((fracao) => <path key={fracao} className="radar-ring" d={caminho(Array(total).fill(fracao))} />)}
        {diagnosticoPerguntas.map((pergunta, index) => {
          const [x, y] = ponto(index, 1)
          return <line key={pergunta.id} className={index === atual ? 'radar-axis active' : 'radar-axis'} x1={CENTRO} y1={CENTRO} x2={x} y2={y} />
        })}
        <path className="radar-shape" d={caminho(fracoes)} fill="url(#radar-preenchimento)" />
        {diagnosticoPerguntas.map((pergunta, index) => {
          const [x, y] = ponto(index, fracoes[index])
          const respondida = respostas[pergunta.id] !== undefined
          return <circle key={pergunta.id} className={respondida ? 'radar-dot answered' : 'radar-dot'} cx={x} cy={y} r={index === atual ? 6 : 4} />
        })}
      </svg>
      {diagnosticoPerguntas.map((pergunta, index) => {
        const [x, y] = ponto(index, 1.3)
        const pode = Boolean(onIrPara) && index <= liberadas && index !== atual
        const classe = ['radar-label', index === atual && 'active', respostas[pergunta.id] !== undefined && 'answered'].filter(Boolean).join(' ')
        const estilo = { left: `${(x / TAMANHO) * 100}%`, top: `${(y / TAMANHO) * 100}%` }
        return pode
          ? <button key={pergunta.id} type="button" className={classe} style={estilo} onClick={() => onIrPara?.(index)} aria-label={`Ir para a pergunta ${index + 1}: ${pergunta.dimensao}`}>{pergunta.dimensao}</button>
          : <span key={pergunta.id} className={classe} style={estilo}>{pergunta.dimensao}</span>
      })}
    </div>
    <figcaption>
      <span className="eyebrow">Mapa da sua empresa</span>
      <span>{respondidas === 0 ? 'Cada resposta desenha uma parte do mapa.' : respondidas < total ? `${respondidas} de ${total} dimensões mapeadas.` : 'Mapa completo. Quanto mais aberto o desenho, mais estruturada a área.'}</span>
    </figcaption>
  </figure>
}
