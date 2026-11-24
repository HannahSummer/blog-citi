import { useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SEO } from '../components/layout/SEO'
import LuzAmbiente from '../components/efeitos/LuzAmbiente'
import { DiagnosticoQuiz } from '../components/diagnostico/DiagnosticoQuiz'
import { DiagnosticoFormulario } from '../components/diagnostico/DiagnosticoFormulario'
import { DiagnosticoRadar } from '../components/diagnostico/DiagnosticoRadar'
import { siteConfig } from '../config/site'
import { PONTUACAO_MAXIMA, calcularResultado, diagnosticoPerguntas, diagnosticoTextos, type Respostas } from '../config/diagnostico'
import { useUtm } from '../hooks/useUtm'

const total = diagnosticoPerguntas.length

export function Diagnostico() {
  const [params] = useSearchParams()
  const utm = useUtm()
  const origem = params.get('origem') ?? ''
  const [abertoEm] = useState(() => Date.now())
  const [respostas, setRespostas] = useState<Respostas>({})
  const [step, setStep] = useState(0)
  const [etapa, setEtapa] = useState<'quiz' | 'formulario'>('quiz')
  const comFormulario = siteConfig.diagnosticoComBanco || siteConfig.diagnosticoModoDemonstracao
  const responder = (id: string, pontos: number) => setRespostas((current) => ({ ...current, [id]: pontos }))
  const refazer = () => { setRespostas({}); setStep(0); setEtapa('quiz') }
  const irPara = (proximo: number) => { setEtapa('quiz'); setStep(proximo) }

  const noFormulario = etapa === 'formulario' && comFormulario
  const fase = noFormulario ? 2 : step >= total ? 1 : 0
  const respondidas = diagnosticoPerguntas.filter((pergunta) => respostas[pergunta.id] !== undefined).length
  const primeiraPendente = diagnosticoPerguntas.findIndex((pergunta) => respostas[pergunta.id] === undefined)
  // O brilho do card cresce com o progresso no quiz e, no resultado, com a pontuação.
  const brilho = fase === 0 ? respondidas / total : calcularResultado(respostas).pontuacao / PONTUACAO_MAXIMA

  return <><SEO title="Faça seu diagnóstico" description="Avalie a maturidade dos processos e decisões digitais da sua empresa." />
    <section className="diagnostic-stage">
      <LuzAmbiente className="diagnostic-ambient" velocidade={0.7} />
      <div className="diagnostic-page container">
        <div className="diagnostic-intro">
          <span className="eyebrow">{diagnosticoTextos.eyebrow}</span>
          <h1>{diagnosticoTextos.titulo} <strong>{diagnosticoTextos.tituloDestaque}</strong></h1>
          <p>{diagnosticoTextos.subtitulo}</p>
          <h2 className="sr-only">{diagnosticoTextos.comoFuncionaTitulo}</h2>
          <ol className="diagnostic-steps">
            {diagnosticoTextos.passos.map((passo, index) => <li key={passo} className={index < fase ? 'done' : index === fase ? 'current' : undefined} aria-current={index === fase ? 'step' : undefined}><span>{String(index + 1).padStart(2, '0')}</span>{passo}</li>)}
          </ol>
        </div>
        <div className="diagnostic-card" style={{ '--brilho': brilho } as CSSProperties}>
          {noFormulario
            ? <DiagnosticoFormulario respostas={respostas} origem={origem} utm={utm} abertoEm={abertoEm} onVoltar={() => setEtapa('quiz')} />
            : <DiagnosticoQuiz respostas={respostas} step={step} onIrPara={irPara} onResponder={responder} onRefazer={refazer} onQuerContato={() => setEtapa('formulario')} comFormulario={comFormulario} origem={origem} utm={utm} />}
        </div>
        <aside className="diagnostic-radar-panel" aria-label="Mapa das respostas">
          <DiagnosticoRadar respostas={respostas} atual={fase === 0 ? step : null} liberadas={primeiraPendente === -1 ? total : primeiraPendente} onIrPara={noFormulario ? undefined : irPara} />
        </aside>
      </div>
    </section>
  </>
}
