import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown } from 'lucide-react'
import { getFotosIntercaladas } from '../../data/momentos'

// Abertura do "Sobre o CITi" inspirada num hero de "scroll morph": as fotos dos momentos chegam
// espalhadas, viram uma fila, depois um círculo, e ao rolar a página se abrem num arco que desliza.
// Usa a rolagem real (seção fixa enquanto o usuário rola), sem travar o scroll da página.

// `primeira`: só a primeira foto de cada momento entra na navegação por teclado.
interface Carta { src: string; titulo: string; slug: string; primeira: boolean }
type Fase = 'espalhadas' | 'fila' | 'circulo'
interface Pose { x: number; y: number; r: number; s: number; o: number }

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))

// Capas e galerias dos momentos, cada foto uma única vez e intercaladas entre os momentos.
function montarCartas(): Carta[] {
  const momentos = new Set<string>()
  return getFotosIntercaladas().map((foto) => {
    const primeira = !momentos.has(foto.slug)
    momentos.add(foto.slug)
    return { ...foto, primeira }
  })
}

export function SobreMorph({ titulo, destaque, descricao }: { titulo: string; destaque: string; descricao: string }) {
  const cartas = useMemo(montarCartas, [])
  const secaoRef = useRef<HTMLElement>(null)
  const palcoRef = useRef<HTMLDivElement>(null)
  const cartasRef = useRef<Array<HTMLAnchorElement | null>>([])
  const introRef = useRef<HTMLDivElement>(null)
  const arcoRef = useRef<HTMLDivElement>(null)
  const [fase, setFase] = useState<Fase>('espalhadas')
  const faseRef = useRef<Fase>('espalhadas')
  faseRef.current = fase

  // Sequência de entrada: espalhadas → fila → círculo (direto para o círculo com movimento reduzido).
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setFase('circulo'); return }
    const t1 = window.setTimeout(() => setFase('fila'), 400)
    const t2 = window.setTimeout(() => setFase('circulo'), 2100)
    return () => { window.clearTimeout(t1); window.clearTimeout(t2) }
  }, [])

  useEffect(() => {
    const secao = secaoRef.current
    const palco = palcoRef.current
    if (!secao || !palco || !cartas.length) return
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const espalhadas: Pose[] = cartas.map((_, i) => ({ x: Math.sin(i * 12.9898) * 900, y: Math.cos(i * 78.233) * 600, r: Math.sin(i * 3.7) * 90, s: 0.35, o: 0 }))
    const atuais: Pose[] = espalhadas.map((pose) => ({ ...pose }))
    let morph = 0
    let giro = 0
    let mouse = 0
    let alvoMouse = 0
    let quadro = 0
    let visivel = true

    const progresso = () => {
      const caixa = secao.getBoundingClientRect()
      const percurso = secao.offsetHeight - window.innerHeight
      return percurso > 0 ? limitar(-caixa.top / percurso) : 0
    }

    const passo = () => {
      const largura = palco.clientWidth
      const altura = palco.clientHeight
      const celular = largura < 768
      // A carta é desenhada no tamanho do arco (CSS) e encolhe no círculo e na fila.
      const escalaCirculo = celular ? 0.72 : 0.6
      const p = progresso()
      // 0–35% da rolagem abre o círculo em arco; o resto desliza o arco.
      const alvoMorph = faseRef.current === 'circulo' ? limitar(p / 0.35) : 0
      const alvoGiro = limitar((p - 0.35) / 0.6)
      const suave = reduzir ? 1 : 0.09
      morph = lerp(morph, alvoMorph, suave)
      giro = lerp(giro, alvoGiro, suave)
      mouse = lerp(mouse, alvoMouse, 0.06)

      const raioCirculo = Math.min(Math.min(largura, altura) * (celular ? 0.43 : 0.34), 320)
      const raioArco = Math.min(largura, altura * 1.5) * (celular ? 1.4 : 1.1)
      const centroArco = altura * (celular ? 0.5 : 0.56) + raioArco
      const abertura = celular ? 100 : 130
      const inicio = -90 - abertura / 2
      const passoArco = abertura / (cartas.length - 1)

      cartas.forEach((_, i) => {
        let alvo: Pose
        if (faseRef.current === 'espalhadas') alvo = espalhadas[i]
        else if (faseRef.current === 'fila') {
          const espaco = celular ? 58 : 94
          alvo = { x: i * espaco - (cartas.length * espaco) / 2 + espaco / 2, y: 0, r: 0, s: escalaCirculo, o: 1 }
        } else {
          const anguloC = (i / cartas.length) * 360
          const radC = (anguloC * Math.PI) / 180
          const anguloA = inicio + i * passoArco - giro * abertura * 0.8
          const radA = (anguloA * Math.PI) / 180
          const circulo = { x: Math.cos(radC) * raioCirculo, y: Math.sin(radC) * raioCirculo, r: anguloC + 90 }
          const arco = { x: Math.cos(radA) * raioArco + mouse, y: Math.sin(radA) * raioArco + centroArco - altura / 2, r: anguloA + 90 }
          alvo = { x: lerp(circulo.x, arco.x, morph), y: lerp(circulo.y, arco.y, morph), r: lerp(circulo.r, arco.r, morph), s: lerp(escalaCirculo, 1, morph), o: 1 }
        }
        const atual = atuais[i]
        const k = reduzir ? 1 : 0.07
        atual.x = lerp(atual.x, alvo.x, k); atual.y = lerp(atual.y, alvo.y, k); atual.r = lerp(atual.r, alvo.r, k); atual.s = lerp(atual.s, alvo.s, k); atual.o = lerp(atual.o, alvo.o, k)
        const elemento = cartasRef.current[i]
        if (elemento) {
          elemento.style.transform = `translate(-50%, -50%) translate(${atual.x.toFixed(1)}px, ${atual.y.toFixed(1)}px) rotate(${atual.r.toFixed(2)}deg) scale(${atual.s.toFixed(3)})`
          elemento.style.opacity = atual.o.toFixed(3)
        }
      })

      if (introRef.current) {
        introRef.current.style.opacity = String(faseRef.current === 'circulo' ? limitar(1 - morph * 2.2) : 0)
        // O texto cabe no miolo do círculo: raio menos a metade da carta deitada nas laterais, com folga.
        introRef.current.style.width = `${Math.max(200, (raioCirculo - (celular ? 50 : 80)) * 2)}px`
      }
      if (arcoRef.current) {
        const t = limitar((morph - 0.75) / 0.25)
        arcoRef.current.style.opacity = String(t)
        arcoRef.current.style.transform = `translateY(${(1 - t) * 24}px)`
      }
      if (visivel) quadro = requestAnimationFrame(passo)
    }

    const aoMover = (evento: PointerEvent) => {
      const caixa = palco.getBoundingClientRect()
      alvoMouse = ((evento.clientX - caixa.left) / caixa.width * 2 - 1) * 60
    }
    const observador = new IntersectionObserver(([entrada]) => { visivel = entrada.isIntersecting; if (visivel) { cancelAnimationFrame(quadro); quadro = requestAnimationFrame(passo) } })
    observador.observe(secao)
    palco.addEventListener('pointermove', aoMover)
    quadro = requestAnimationFrame(passo)
    return () => { cancelAnimationFrame(quadro); observador.disconnect(); palco.removeEventListener('pointermove', aoMover) }
  }, [cartas])

  return <section className="sobre-morph" ref={secaoRef} aria-label="Momentos do CITi em fotos">
    <div className="sobre-morph-palco" ref={palcoRef}>
      <div className="sobre-morph-luz" aria-hidden="true" />
      <div className="sobre-morph-intro" ref={introRef}>
        <span className="eyebrow">Sobre o CITi</span>
        <p className="sobre-morph-intro-titulo">Mais de 30 anos<br />de <strong>movimento.</strong></p>
        <span className="sobre-morph-dica"><ArrowDown size={14} aria-hidden="true" /> Role para explorar</span>
      </div>
      <div className="sobre-morph-arco" ref={arcoRef}>
        <h1>{titulo} <strong>{destaque}</strong></h1>
        <p>{descricao}</p>
      </div>
      {cartas.map((carta, i) => <Link className="sobre-morph-carta" title={carta.titulo} to={`/blog/sobre/${carta.slug}`} key={i} ref={(elemento) => { cartasRef.current[i] = elemento }} tabIndex={carta.primeira ? 0 : -1} aria-label={carta.titulo} style={{ opacity: 0 }}>
        <span className="sobre-morph-foto"><img src={carta.src} alt="" decoding="async" /></span>
      </Link>)}
    </div>
  </section>
}
