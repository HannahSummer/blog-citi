import { useEffect, useRef } from 'react'

interface Props {
  className?: string
  velocidade?: number
}

const TEMPO_ESTATICO = 5

function criarLuz(criarCanvas: (w: number, h: number) => HTMLCanvasElement) {
  const baixa = criarCanvas(1, 1)
  const b = baixa.getContext('2d')!
  const temp = criarCanvas(1, 1)
  const tb = temp.getContext('2d')!
  const desfocar = (raio: number) => {
    if (temp.width !== baixa.width || temp.height !== baixa.height) { temp.width = baixa.width; temp.height = baixa.height }
    const offs: [number, number][] = [[0, 0], [raio, 0], [-raio, 0], [0, raio], [0, -raio], [raio, raio], [-raio, -raio], [raio, -raio], [-raio, raio]]
    tb.clearRect(0, 0, temp.width, temp.height)
    offs.forEach(([dx, dy], k) => { tb.globalAlpha = 1 / (k + 1); tb.drawImage(baixa, dx, dy) })
    tb.globalAlpha = 1
    b.globalCompositeOperation = 'copy'; b.drawImage(temp, 0, 0); b.globalCompositeOperation = 'lighter'
  }
  const ESCALA = 0.16
  const INTENSIDADE = 0.42
  const fitas = [
    { y: 0.42, amp: 0.16, freq: 1.1, vel: 0.05, fase: 0.0, larg: 0.10, a: 0.20 },
    { y: 0.60, amp: 0.12, freq: 1.6, vel: 0.07, fase: 2.1, larg: 0.07, a: 0.16 },
    { y: 0.30, amp: 0.10, freq: 2.0, vel: 0.04, fase: 4.3, larg: 0.05, a: 0.12 },
    { y: 0.75, amp: 0.09, freq: 1.3, vel: 0.06, fase: 5.7, larg: 0.06, a: 0.10 },
  ]
  const brilhos = Array.from({ length: 4 }, (_, i) => ({ nasce: i * 2.3, vida: 3.4 }))
  const particulas = Array.from({ length: 22 }, (_, i) => ({
    x: (Math.sin(i * 91.7) + 1) / 2, y: (Math.sin(i * 47.3) + 1) / 2,
    r: 0.6 + (((i * 37) % 10) / 10) * 1.3, vx: 0.003 + (i % 5) * 0.0015, fase: i,
  }))
  const aleat = (n: number) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s) }

  return function desenhar(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    const bw = Math.max(2, Math.round(w * ESCALA)), bh = Math.max(2, Math.round(h * ESCALA))
    if (baixa.width !== bw || baixa.height !== bh) { baixa.width = bw; baixa.height = bh }
    b.clearRect(0, 0, bw, bh)
    b.globalCompositeOperation = 'lighter'
    const mascara = (a: number) => {
      const g = b.createLinearGradient(0, 0, bw, 0)
      g.addColorStop(0, 'rgba(0,219,110,0)')
      g.addColorStop(0.35, `rgba(0,219,110,${a * 0.12})`)
      g.addColorStop(0.65, `rgba(20,230,130,${a})`)
      g.addColorStop(1, `rgba(0,200,120,${a * 0.7})`)
      return g
    }
    const feixes = [
      { x: 0.64 + Math.sin(t * 0.07) * 0.07, larg: 0.16, a: 0.30 },
      { x: 0.88 + Math.sin(t * 0.05 + 2) * 0.05, larg: 0.1, a: 0.16 },
    ]
    for (const f of feixes) {
      const cx = f.x * bw, rx = f.larg * bw
      b.save(); b.translate(cx, 0); b.scale(1, (bh * 1.1) / rx)
      const g = b.createRadialGradient(0, 0, 0, 0, 0, rx)
      g.addColorStop(0, `rgba(0,219,89,${f.a * INTENSIDADE})`); g.addColorStop(0.45, `rgba(0,180,95,${f.a * 0.4 * INTENSIDADE})`); g.addColorStop(1, 'rgba(0,120,80,0)')
      b.fillStyle = g; b.fillRect(-rx, 0, rx * 2, rx)
      b.restore()
    }
    for (const f of fitas) {
      const topo: [number, number][] = [], base: [number, number][] = []
      const pulso = 0.65 + 0.35 * Math.sin(t * 0.35 + f.fase)
      for (let k = 0; k <= 30; k++) {
        const x = (k / 30) * 1.2 - 0.1
        const yc = f.y + f.amp * Math.sin(x * f.freq * 3 + t * f.vel * 5 + f.fase) + 0.035 * Math.sin(x * 6 - t * 0.25 + f.fase)
        const esp = f.larg * (0.25 + 0.75 * Math.pow(Math.sin(x * 2.2 + t * 0.12 + f.fase), 2))
        topo.push([x * bw, (yc - esp) * bh]); base.push([x * bw, (yc + esp * 0.6) * bh])
      }
      b.beginPath()
      topo.forEach(([x, y], k) => (k ? b.lineTo(x, y) : b.moveTo(x, y)))
      for (let k = base.length - 1; k >= 0; k--) b.lineTo(base[k][0], base[k][1])
      b.closePath()
      b.fillStyle = mascara(f.a * pulso * INTENSIDADE); b.fill()
      b.beginPath(); topo.forEach(([x, y], k) => (k ? b.lineTo(x, y) : b.moveTo(x, y)))
      b.lineWidth = Math.max(1, bh * 0.012); b.strokeStyle = mascara(f.a * 1.6 * pulso * INTENSIDADE); b.stroke()
    }
    desfocar(2); desfocar(1)
    ctx.clearRect(0, 0, w, h)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(baixa, 0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'
    const esc = Math.min(1.4, w / 1200 + 0.4)
    for (let i = 0; i < brilhos.length; i++) {
      const br = brilhos[i]
      const ciclo = Math.floor((t + br.nasce) / (br.vida + 3))
      const local = (t + br.nasce) % (br.vida + 3)
      if (local > br.vida) continue
      const p = local / br.vida
      const a = Math.sin(p * Math.PI)
      const x = (0.5 + aleat(ciclo * 7 + i) * 0.45) * w
      const y = (0.2 + aleat(ciclo * 13 + i) * 0.65) * h
      const r = (16 + aleat(ciclo + i * 3) * 26) * esc
      const ini = aleat(ciclo * 3 + i) * Math.PI * 2 + p * 0.7
      ctx.beginPath(); ctx.arc(x, y, r, ini, ini + 1.1)
      ctx.lineCap = 'round'
      ctx.lineWidth = 7; ctx.strokeStyle = `rgba(0,219,89,${0.1 * a})`; ctx.stroke()
      ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(210,255,230,${0.75 * a})`; ctx.stroke()
    }
    for (const pt of particulas) {
      const x = ((((pt.x + t * pt.vx) % 1) + 1) % 1) * w
      const y = (pt.y + Math.sin(t * 0.3 + pt.fase) * 0.02) * h
      const a = (0.2 + 0.6 * Math.max(0, Math.sin(t * 0.8 + pt.fase * 2))) * (0.3 + 0.7 * (x / w))
      ctx.beginPath(); ctx.arc(x, y, pt.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(170,255,210,${a * 0.6})`; ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
  }
}

export default function LuzAmbiente({ className = '', velocidade = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const desenhar = criarLuz((w, h) => {
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      return c
    })
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)')
    let largura = 0
    let altura = 0
    let raf = 0
    let visivel = true
    let tempo = TEMPO_ESTATICO
    let ultimo = 0
    const redimensionar = () => {
      const { width, height } = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      largura = width
      altura = height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      desenhar(ctx, largura, altura, tempo)
    }
    const quadro = (agora: number) => {
      const dt = ultimo ? Math.min((agora - ultimo) / 1000, 0.1) : 0
      ultimo = agora
      tempo += dt * velocidade
      desenhar(ctx, largura, altura, tempo)
      raf = requestAnimationFrame(quadro)
    }
    const iniciar = () => {
      if (raf || reduzir.matches || !visivel || document.hidden) return
      ultimo = 0
      raf = requestAnimationFrame(quadro)
    }
    const parar = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    const aoMudarMovimento = () => {
      if (reduzir.matches) {
        parar()
        desenhar(ctx, largura, altura, TEMPO_ESTATICO)
      } else iniciar()
    }
    const aoMudarAba = () => (document.hidden ? parar() : iniciar())
    const ro = new ResizeObserver(redimensionar)
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting
      if (visivel) iniciar()
      else parar()
    })
    io.observe(canvas)
    reduzir.addEventListener('change', aoMudarMovimento)
    document.addEventListener('visibilitychange', aoMudarAba)
    redimensionar()
    iniciar()
    return () => {
      parar()
      ro.disconnect()
      io.disconnect()
      reduzir.removeEventListener('change', aoMudarMovimento)
      document.removeEventListener('visibilitychange', aoMudarAba)
    }
  }, [velocidade])

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 block h-full w-full ${className}`} />
}
