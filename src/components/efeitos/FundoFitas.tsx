import { useEffect, useRef } from 'react'

// Fundo do banner do Blog: uma fita de linhas finas que ondula devagar, no degradê azul → verde
// das capas. Segue o mesmo contrato do LuzAmbiente (canvas absoluto atrás do conteúdo).

const LINHAS = 64
// Azul só na ponta; o resto da fita é verde.
const CORES: Array<[number, number, number]> = [[61, 99, 224], [43, 179, 166], [34, 209, 122], [0, 219, 89]]

function corEm(t: number) {
  const posicao = Math.min(0.999, Math.max(0, t)) * (CORES.length - 1)
  const i = Math.floor(posicao)
  const f = posicao - i
  return CORES[i].map((canal, k) => Math.round(canal + (CORES[i + 1][k] - canal) * f)) as [number, number, number]
}

export default function FundoFitas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const contexto = canvas?.getContext('2d')
    if (!canvas || !contexto) return
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let largura = 0
    let altura = 0
    let quadro = 0
    let visivel = true
    let alvoMouse = 0.5
    let mouse = 0.5

    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      largura = canvas.clientWidth
      altura = canvas.clientHeight
      canvas.width = largura * dpr
      canvas.height = altura * dpr
      contexto.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const desenhar = (tempo: number) => {
      const t = tempo / 1000
      mouse += (alvoMouse - mouse) * 0.04
      contexto.clearRect(0, 0, largura, altura)
      contexto.globalCompositeOperation = 'lighter'
      // A fita ocupa a metade direita e desce em diagonal; cada linha é um pouco defasada da anterior.
      for (let i = 0; i < LINHAS; i++) {
        const p = i / (LINHAS - 1)
        const [r, g, b] = corEm(p)
        contexto.strokeStyle = `rgba(${r},${g},${b},${0.12 + 0.3 * Math.sin(p * Math.PI)})`
        contexto.lineWidth = 1.1
        contexto.beginPath()
        for (let passo = 0; passo <= 48; passo++) {
          const x = (passo / 48) * largura * 1.1 - largura * 0.05
          const u = x / largura
          const onda = Math.sin(u * 3.1 + t * 0.35 + p * 1.6) * 0.16 + Math.sin(u * 7 - t * 0.22 + p * 3) * 0.035
          const torcao = Math.sin(t * 0.18 + u * 2.2) * (p - 0.5) * 0.5
          const y = altura * (0.18 + u * 0.38 + onda + torcao * 0.6 + (p - 0.5) * 0.32 + (mouse - 0.5) * 0.08 * Math.sin(u * Math.PI))
          if (passo === 0) contexto.moveTo(x, y)
          else contexto.lineTo(x, y)
        }
        contexto.stroke()
      }
      contexto.globalCompositeOperation = 'source-over'
    }

    const laco = (tempo: number) => {
      desenhar(tempo)
      if (visivel && !reduzir) quadro = requestAnimationFrame(laco)
    }
    const iniciar = () => { cancelAnimationFrame(quadro); quadro = requestAnimationFrame(laco) }

    const aoMover = (evento: PointerEvent) => { alvoMouse = evento.clientY / window.innerHeight }
    const observador = new IntersectionObserver(([entrada]) => { visivel = entrada.isIntersecting; if (visivel) iniciar() })
    const redimensionar = new ResizeObserver(() => { medir(); desenhar(performance.now()) })
    observador.observe(canvas)
    redimensionar.observe(canvas)
    window.addEventListener('pointermove', aoMover, { passive: true })
    medir()
    iniciar()

    return () => {
      cancelAnimationFrame(quadro)
      observador.disconnect()
      redimensionar.disconnect()
      window.removeEventListener('pointermove', aoMover)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className={`fundo-fitas pointer-events-none absolute inset-0 block h-full w-full ${className}`} />
}
