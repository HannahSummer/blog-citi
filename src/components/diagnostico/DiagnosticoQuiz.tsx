import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, RotateCcw } from 'lucide-react'
import { siteConfig } from '../../config/site'
import { PONTUACAO_MAXIMA, buscarNivel, calcularResultado, diagnosticoNiveis, diagnosticoPerguntas, diagnosticoTextos, type Respostas } from '../../config/diagnostico'
import type { UtmParams } from '../../hooks/useUtm'

const ATRASO_AVANCO_MS = 380
const total = diagnosticoPerguntas.length
const doisDigitos = (n: number) => String(n).padStart(2, '0')
const reduzMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function buildContactUrl(origin: string, utm: UtmParams) {
  const base = siteConfig.ctaContatoUrl || 'mailto:contato@TODO'
  if (!siteConfig.ctaContatoUrl) console.warn('[diagnostico] ctaContatoUrl está vazio; usando contato@TODO')
  const params = new URLSearchParams({ origem: origin || 'diagnostico' })
  Object.entries(utm).forEach(([key, value]) => value && params.set(key, value))
  return `${base}${base.includes('?') ? '&' : '?'}${params.toString()}`
}

// Conta de 0 até o alvo; sem animação para quem pede menos movimento.
function useContagem(alvo: number) {
  const [valor, setValor] = useState(() => (reduzMovimento() ? alvo : 0))
  useEffect(() => {
    if (reduzMovimento()) { setValor(alvo); return }
    let raf = 0
    const inicio = performance.now()
    const passo = (agora: number) => {
      const p = Math.min(1, (agora - inicio) / 900)
      setValor(Math.round(alvo * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [alvo])
  return valor
}

interface DiagnosticoQuizProps {
  respostas: Respostas
  step: number
  onIrPara: (step: number) => void
  onResponder: (id: string, pontos: number) => void
  onRefazer: () => void
  onQuerContato: () => void
  comFormulario: boolean
  origem: string
  utm: UtmParams
}

export function DiagnosticoQuiz(props: DiagnosticoQuizProps) {
  return props.step >= total ? <Resultado {...props} /> : <Pergunta {...props} />
}

function Pergunta({ respostas, step, onIrPara, onResponder, onRefazer }: DiagnosticoQuizProps) {
  const fieldsetRef = useRef<HTMLFieldSetElement>(null)
  const timer = useRef(0)
  const navegou = useRef(false)
  const question = diagnosticoPerguntas[step]
  const respondida = respostas[question.id] !== undefined
  const primeiraPendente = diagnosticoPerguntas.findIndex((pergunta) => respostas[pergunta.id] === undefined)
  const liberadas = primeiraPendente === -1 ? total : primeiraPendente

  const irPara = (proximo: number) => { window.clearTimeout(timer.current); navegou.current = true; onIrPara(Math.max(0, Math.min(total, proximo))) }
  const escolher = (pontos: number, avancar: boolean) => {
    onResponder(question.id, pontos)
    window.clearTimeout(timer.current)
    if (avancar) timer.current = window.setTimeout(() => irPara(step + 1), reduzMovimento() ? 0 : ATRASO_AVANCO_MS)
  }

  // Ao trocar de pergunta, o foco vai para a opção marcada (ou a primeira).
  useEffect(() => {
    if (navegou.current || step > 0) fieldsetRef.current?.querySelector<HTMLInputElement>('input:checked, input')?.focus({ preventScroll: true })
    return () => window.clearTimeout(timer.current)
  }, [step])

  // Atalhos: 1, 2 e 3 escolhem e avançam; Enter avança quando o foco não está num botão ou link.
  useEffect(() => {
    const aoTeclar = (event: globalThis.KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const alvo = event.target as HTMLElement
      if (alvo.closest('textarea, select, input:not([type=radio]), [contenteditable]')) return
      const indice = ['1', '2', '3'].indexOf(event.key)
      if (indice >= 0 && question.options[indice]) { event.preventDefault(); escolher(question.options[indice].points, true) }
      if (event.key === 'Enter' && !alvo.closest('button, a') && respostas[question.id] !== undefined) { event.preventDefault(); irPara(step + 1) }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  })

  // Clique de mouse/toque (detail > 0) marca e avança; setas só marcam.
  const aoClicar = (event: MouseEvent, pontos: number) => { if (event.detail > 0) escolher(pontos, true) }
  const aoTeclarFieldset = (event: KeyboardEvent<HTMLFieldSetElement>) => { if (event.key === 'Enter') event.preventDefault() }

  return <div className="diagnostic-question">
    <span className="question-ghost" aria-hidden="true">{doisDigitos(step + 1)}</span>
    <div className="diagnostic-progress">
      <div className="progress-head"><span aria-live="polite">Pergunta {step + 1} de {total}</span><span className="progress-dimension">{question.dimensao}</span></div>
      <ol className="progress-segments">
        {diagnosticoPerguntas.map((pergunta, index) => {
          const classe = ['progress-segment', index === step && 'current', respostas[pergunta.id] !== undefined && 'done'].filter(Boolean).join(' ')
          return <li key={pergunta.id}><button type="button" className={classe} onClick={() => irPara(index)} disabled={index > liberadas || index === step} aria-label={`Pergunta ${index + 1}: ${pergunta.dimensao}`} aria-current={index === step ? 'step' : undefined} /></li>
        })}
      </ol>
    </div>
    <div className="question-body" key={step}>
      <fieldset ref={fieldsetRef} onKeyDown={aoTeclarFieldset}>
        <legend>{question.question}</legend>
        <div className="quiz-options">
          {question.options.map((option, index) => <label className="quiz-option" key={option.label} onClick={(event) => aoClicar(event, option.points)}>
            <input type="radio" name={question.id} value={option.points} checked={respostas[question.id] === option.points} onChange={() => escolher(option.points, false)} />
            <kbd aria-hidden="true">{index + 1}</kbd>
            <span className="quiz-option-label">{option.label}</span>
            <span className="quiz-option-check" aria-hidden="true"><Check size={16} /></span>
          </label>)}
        </div>
      </fieldset>
    </div>
    <div className="quiz-actions">
      <button type="button" className="button-secondary" onClick={() => irPara(step - 1)} disabled={step === 0}><ArrowLeft size={15} /> Voltar</button>
      <span className="quiz-hint" aria-hidden="true">Tecle <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> ou <kbd>Enter</kbd></span>
      <button type="button" className="button-primary" onClick={() => irPara(step + 1)} disabled={!respondida}>{step === total - 1 ? 'Ver resultado' : 'Próxima'} <ArrowRight size={17} /></button>
    </div>
    {Object.keys(respostas).length > 0 && <button type="button" className="link-button" onClick={() => { onRefazer(); irPara(0) }}><RotateCcw size={14} /> {diagnosticoTextos.refazer}</button>}
  </div>
}

function Resultado({ respostas, onIrPara, onRefazer, onQuerContato, comFormulario, origem, utm }: DiagnosticoQuizProps) {
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const { pontuacao, nivel } = calcularResultado(respostas)
  const resultado = buscarNivel(nivel)
  const contagem = useContagem(pontuacao)
  const [marcador, setMarcador] = useState(0)
  // Dimensões abaixo do máximo, das mais fracas para as mais fortes.
  const focos = diagnosticoPerguntas
    .map((pergunta, index) => ({ pergunta, index, pontos: respostas[pergunta.id] ?? 0 }))
    .filter((item) => item.pontos < 2)
    .sort((a, b) => a.pontos - b.pontos)
    .slice(0, 3)

  useEffect(() => {
    tituloRef.current?.focus({ preventScroll: true })
    const raf = requestAnimationFrame(() => setMarcador(pontuacao / PONTUACAO_MAXIMA))
    return () => cancelAnimationFrame(raf)
  }, [pontuacao])

  return <div className="diagnostic-result">
    <div className="result-top">
      <span className="eyebrow">{diagnosticoTextos.resultadoEyebrow}</span>
      <button type="button" className="link-button" onClick={() => { onRefazer(); onIrPara(0) }}><RotateCcw size={14} /> {diagnosticoTextos.refazer}</button>
    </div>
    <div className="result-hero">
      <h2 ref={tituloRef} tabIndex={-1}><small>Sua empresa está no nível</small>{resultado.label}</h2>
      <p className="result-score" aria-label={`${pontuacao} de ${PONTUACAO_MAXIMA} pontos`}><strong>{doisDigitos(contagem)}</strong><span>/{PONTUACAO_MAXIMA}</span></p>
    </div>
    <div className="score-scale" aria-hidden="true">
      <div className="score-track">
        {diagnosticoNiveis.map((item, index) => {
          // Cada faixa ocupa da metade do degrau anterior até a metade do próximo (0–3,5; 3,5–6,5; …).
          const inicio = index === 0 ? 0 : diagnosticoNiveis[index - 1].max + 0.5
          const fim = Math.min(item.max + 0.5, PONTUACAO_MAXIMA)
          return <span key={item.id} className={item.id === nivel ? 'score-band active' : 'score-band'} style={{ flexGrow: fim - inicio }}><i>{item.label}</i></span>
        })}
        <span className="score-marker" style={{ left: `${marcador * 100}%` }} />
      </div>
    </div>
    <p className="result-description">{resultado.description}</p>
    {focos.length > 0 && <div className="result-focus">
      <h3>Onde focar primeiro</h3>
      <ul>
        {focos.map(({ pergunta, index, pontos }) => <li key={pergunta.id}>
          <span className="focus-meter" aria-label={`${pontos} de 2 pontos`}><i className={pontos >= 1 ? 'on' : ''} /><i className={pontos >= 2 ? 'on' : ''} /></span>
          <div><strong>{pergunta.dimensao}</strong><p>{pergunta.foco}</p></div>
          <button type="button" className="link-button" onClick={() => onIrPara(index)} aria-label={`Rever a resposta sobre ${pergunta.dimensao}`}>Rever</button>
        </li>)}
      </ul>
    </div>}
    <div className="diagnostic-next">
      <h3>{diagnosticoTextos.chamadaFormularioTitulo}</h3>
      <p>{diagnosticoTextos.chamadaFormularioTexto}</p>
      {comFormulario
        ? <button type="button" className="button-primary" onClick={onQuerContato}>{diagnosticoTextos.botaoFormulario} <ArrowRight size={17} /></button>
        : <a className="button-primary" href={buildContactUrl(origem, utm)} target="_blank" rel="noreferrer">{diagnosticoTextos.botaoContato} <ArrowUpRight size={17} /></a>}
    </div>
    <button type="button" className="button-secondary result-back" onClick={() => onIrPara(total - 1)}><ArrowLeft size={15} /> Voltar às perguntas</button>
  </div>
}
