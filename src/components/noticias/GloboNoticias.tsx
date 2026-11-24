import { useEffect, useMemo, useRef, useState } from 'react'
import { geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo'
import type { Position } from 'geojson'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import { continentes } from '../../data/continentes'
import type { NewsItem } from '../../data/noticias'

// Globo pontilhado (inspirado em um wireframe com d3) que posiciona as notícias por continente.
// Arrastar gira; tocar em um continente mostra as notícias dele. Os botões abaixo fazem o mesmo pelo teclado.

interface Ponto { lng: number; lat: number; continente: number }
interface Marcador { item: NewsItem; continente: number; lng: number; lat: number }

const PASSO = 1.5 // graus entre os pontos de terra
const INCLINACAO_PADRAO = -18

function dentroDoAnel([x, y]: [number, number], anel: Position[]) {
  let dentro = false
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i]
    const [xj, yj] = anel[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro
  }
  return dentro
}

function continenteMaisProximo(lng: number, lat: number) {
  let melhor = -1
  let menor = Infinity
  continentes.forEach((continente, indice) => continente.referencias.forEach((referencia) => {
    const distancia = geoDistance([lng, lat], referencia)
    if (distancia < menor) { menor = distancia; melhor = indice }
  }))
  return melhor
}

// Grade de pontos sobre a terra, com espaçamento de longitude corrigido pela latitude. A Antártida fica de fora.
async function gerarPontos(): Promise<Ponto[]> {
  const topologia = (await import('world-atlas/land-110m.json')).default as unknown as Topology<{ land: GeometryCollection }>
  const terra = feature(topologia, topologia.objects.land)
  const poligonos = terra.features.flatMap(({ geometry }) => geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : [])
  // Anéis que cruzam o antimeridiano (Fiji, Rússia) saltam de 180 para -180; desenrola as longitudes para o teste plano funcionar.
  const desenrolar = (anel: Position[]) => {
    let ajuste = 0
    return anel.map(([lng, lat], indice): Position => {
      if (indice > 0) { const anterior = anel[indice - 1][0]; if (lng - anterior > 180) ajuste -= 360; else if (anterior - lng > 180) ajuste += 360 }
      return [lng + ajuste, lat]
    })
  }
  const pontos: Ponto[] = []
  for (const [contorno, ...buracos] of poligonos.map((poligono) => poligono.map(desenrolar))) {
    const lngs = contorno.map((posicao) => posicao[0])
    const lats = contorno.map((posicao) => posicao[1])
    const [minLat, maxLat] = [Math.max(Math.min(...lats), -58), Math.max(...lats)]
    for (let lat = Math.ceil(minLat / PASSO) * PASSO; lat <= maxLat; lat += PASSO) {
      const passoLng = PASSO / Math.max(Math.cos((lat * Math.PI) / 180), 0.35)
      for (let i = Math.ceil((Math.min(...lngs) + 180) / passoLng); -180 + i * passoLng <= Math.max(...lngs); i++) {
        const lng = -180 + i * passoLng
        if (!dentroDoAnel([lng, lat], contorno) || buracos.some((buraco) => dentroDoAnel([lng, lat], buraco))) continue
        const normal = ((lng + 540) % 360) - 180
        pontos.push({ lng: normal, lat, continente: continenteMaisProximo(normal, lat) })
      }
    }
  }
  return pontos
}

// Notícias sem coordenada ficam perto do centro do continente, espalhadas para não se sobreporem.
function marcadores(noticias: NewsItem[]): Marcador[] {
  return noticias.flatMap((item, indice) => {
    const continente = continentes.findIndex((atual) => atual.slug === item.continente)
    if (continente < 0) return []
    const [lng, lat] = item.coordenadas ?? [continentes[continente].centro[0] + ((indice * 7) % 13) - 6, continentes[continente].centro[1] + ((indice * 5) % 9) - 4]
    return [{ item, continente, lng, lat }]
  })
}

const reduzirMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// `selecionado` e `onSelecionar`: o continente escolhido fica com a página (que filtra a lista e mostra o painel).
// `decorativo`: só o globo girando (arrastável), sem pinos, botões de continente nem instrução. Usado na Home.
export default function GloboNoticias({ noticias, selecionado: selecionadoPagina, onSelecionar, decorativo = false }: { noticias: NewsItem[]; selecionado?: number | null; onSelecionar?: (indice: number | null) => void; decorativo?: boolean }) {
  const caixaRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotuloRef = useRef<HTMLSpanElement>(null)
  const [carregado, setCarregado] = useState(false)
  const [interno, setInterno] = useState<number | null>(null)
  const selecionado = selecionadoPagina !== undefined ? selecionadoPagina : interno

  const pinos = useMemo(() => (decorativo ? [] : marcadores(noticias)), [noticias, decorativo])
  const porContinente = useMemo(() => continentes.map((_, indice) => pinos.filter((pino) => pino.continente === indice).map((pino) => pino.item)), [pinos])
  // O efeito do canvas lê a seleção e os pinos por ref, para não recriar o globo a cada clique.
  const estado = useRef({ selecionado, pinos, decorativo, escolher: (_indice: number | null) => {} })
  estado.current.selecionado = selecionado
  estado.current.pinos = pinos

  const escolher = (indice: number | null) => { if (onSelecionar) onSelecionar(indice); else setInterno(indice) }
  estado.current.escolher = escolher

  useEffect(() => {
    const caixa = caixaRef.current
    const canvas = canvasRef.current
    const contexto = canvas?.getContext('2d')
    if (!caixa || !canvas || !contexto) return
    const cor = getComputedStyle(caixa).getPropertyValue('--lime').trim() || '#00db59'
    const projecao = geoOrthographic().clipAngle(90).precision(0.5)
    const caminho = geoPath(projecao, contexto)
    const grade = geoGraticule10()
    const rotacao: [number, number] = [-continentes[0].centro[0], INCLINACAO_PADRAO]
    const alvo: { rotacao: [number, number] | null } = { rotacao: null }
    let pontos: Ponto[] = []
    let tamanho = 0
    let hover = -1
    let arrastando = false
    let visivel = true
    let quadro = 0
    let ultimoSelecionado: number | null = null
    let cancelado = false

    const medir = () => {
      tamanho = caixa.clientWidth
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = tamanho * dpr
      canvas.height = tamanho * dpr
      canvas.style.width = `${tamanho}px`
      canvas.style.height = `${tamanho}px`
      contexto.setTransform(dpr, 0, 0, dpr, 0, 0)
      projecao.scale(tamanho / 2 - 4).translate([tamanho / 2, tamanho / 2])
    }

    const desenhar = (tempo: number) => {
      const raio = projecao.scale()
      const centro: [number, number] = [-rotacao[0], -rotacao[1]]
      const meio = tamanho / 2
      const { selecionado: ativo, pinos: listaPinos } = estado.current
      contexto.clearRect(0, 0, tamanho, tamanho)

      const oceano = contexto.createRadialGradient(meio - raio * 0.35, meio - raio * 0.4, raio * 0.1, meio, meio, raio)
      oceano.addColorStop(0, '#13201a')
      oceano.addColorStop(1, '#131b17')
      contexto.beginPath()
      contexto.arc(meio, meio, raio, 0, Math.PI * 2)
      contexto.fillStyle = oceano
      contexto.fill()

      contexto.beginPath()
      caminho(grade)
      contexto.strokeStyle = 'rgba(255,255,255,.06)'
      contexto.lineWidth = 0.6
      contexto.stroke()

      // Um Path2D por tom: terra comum, continente sob o cursor e continente escolhido; os da borda mais apagados.
      const tons = { base: new Path2D(), baseBorda: new Path2D(), hover: new Path2D(), ativo: new Path2D(), ativoBorda: new Path2D() }
      const r = Math.max(raio / 210, 0.9)
      for (const ponto of pontos) {
        const distancia = geoDistance([ponto.lng, ponto.lat], centro)
        if (distancia > 1.55) continue
        const xy = projecao([ponto.lng, ponto.lat])
        if (!xy) continue
        const borda = distancia > 1.2
        const tom = ponto.continente === ativo ? (borda ? tons.ativoBorda : tons.ativo) : ponto.continente === hover ? tons.hover : borda ? tons.baseBorda : tons.base
        tom.moveTo(xy[0] + r, xy[1])
        tom.arc(xy[0], xy[1], r, 0, Math.PI * 2)
      }
      const pintar = (path: Path2D, estilo: string, alfa: number) => { contexto.globalAlpha = alfa; contexto.fillStyle = estilo; contexto.fill(path) }
      pintar(tons.baseBorda, '#8a948e', 0.28)
      pintar(tons.base, '#8a948e', 0.62)
      pintar(tons.hover, '#e3e9e5', 0.85)
      pintar(tons.ativoBorda, cor, 0.45)
      pintar(tons.ativo, cor, 1)
      contexto.globalAlpha = 1

      contexto.beginPath()
      contexto.arc(meio, meio, raio, 0, Math.PI * 2)
      contexto.strokeStyle = 'rgba(0,219,89,.28)'
      contexto.lineWidth = 1
      contexto.stroke()

      // Pinos das notícias, com um anel pulsando.
      const pulso = reduzirMovimento() ? 0.5 : (tempo / 1600) % 1
      for (const pino of listaPinos) {
        if (geoDistance([pino.lng, pino.lat], centro) > 1.45) continue
        const xy = projecao([pino.lng, pino.lat])
        if (!xy) continue
        const destaque = pino.continente === ativo
        contexto.beginPath()
        contexto.arc(xy[0], xy[1], (destaque ? 6 : 4) + pulso * 10, 0, Math.PI * 2)
        contexto.strokeStyle = cor
        contexto.globalAlpha = (1 - pulso) * 0.7
        contexto.lineWidth = 1.2
        contexto.stroke()
        contexto.globalAlpha = 1
        contexto.beginPath()
        contexto.arc(xy[0], xy[1], destaque ? 5 : 3.5, 0, Math.PI * 2)
        contexto.fillStyle = destaque ? '#ffffff' : cor
        contexto.fill()
        contexto.lineWidth = 2
        contexto.strokeStyle = destaque ? cor : '#131b17'
        contexto.stroke()
      }
    }

    const passo = (tempo: number) => {
      if (cancelado) return
      const { selecionado: ativo } = estado.current
      if (ativo !== ultimoSelecionado) {
        ultimoSelecionado = ativo
        const centroAlvo = ativo === null ? null : continentes[ativo].centro
        alvo.rotacao = centroAlvo ? [-centroAlvo[0], Math.max(-40, Math.min(40, -centroAlvo[1]))] : null
        if (alvo.rotacao && reduzirMovimento()) { [rotacao[0], rotacao[1]] = alvo.rotacao; alvo.rotacao = null }
      }
      if (alvo.rotacao && !arrastando) {
        const delta = ((alvo.rotacao[0] - rotacao[0] + 540) % 360) - 180
        rotacao[0] += delta * 0.1
        rotacao[1] += (alvo.rotacao[1] - rotacao[1]) * 0.1
        if (Math.abs(delta) < 0.05 && Math.abs(alvo.rotacao[1] - rotacao[1]) < 0.05) alvo.rotacao = null
      } else if (!arrastando && ativo === null && !reduzirMovimento()) {
        rotacao[0] += 0.12
      }
      projecao.rotate(rotacao)
      desenhar(tempo)
      if (visivel) quadro = requestAnimationFrame(passo)
    }
    const animar = () => { cancelAnimationFrame(quadro); quadro = requestAnimationFrame(passo) }

    // Converte a posição do cursor em continente: primeiro um pino próximo, depois a terra sob o cursor.
    const continenteEm = (x: number, y: number) => {
      const centro: [number, number] = [-rotacao[0], -rotacao[1]]
      for (const pino of estado.current.pinos) {
        const xy = projecao([pino.lng, pino.lat])
        if (xy && geoDistance([pino.lng, pino.lat], centro) < 1.45 && Math.hypot(xy[0] - x, xy[1] - y) < 14) return pino.continente
      }
      if (Math.hypot(x - tamanho / 2, y - tamanho / 2) > projecao.scale()) return -1
      const lugar = projecao.invert?.([x, y])
      if (!lugar) return -1
      const perto = pontos.find((ponto) => Math.abs(ponto.lat - lugar[1]) < PASSO * 1.2 && geoDistance([ponto.lng, ponto.lat], lugar) < (PASSO * 1.6 * Math.PI) / 180)
      return perto ? perto.continente : -1
    }

    const mostrarRotulo = (indice: number, x: number, y: number) => {
      const rotulo = rotuloRef.current
      if (!rotulo) return
      if (indice < 0) { rotulo.hidden = true; return }
      const total = estado.current.pinos.filter((pino) => pino.continente === indice).length
      rotulo.hidden = false
      rotulo.textContent = `${continentes[indice].label} · ${total === 1 ? '1 notícia' : `${total} notícias`}`
      rotulo.style.transform = `translate(${x + 14}px, ${y - 10}px)`
    }

    let inicio: { x: number; y: number; rotacao: [number, number]; id: number } | null = null
    const local = (evento: PointerEvent) => { const caixaCanvas = canvas.getBoundingClientRect(); return { x: evento.clientX - caixaCanvas.left, y: evento.clientY - caixaCanvas.top } }
    const aoPressionar = (evento: PointerEvent) => {
      inicio = { ...local(evento), rotacao: [rotacao[0], rotacao[1]], id: evento.pointerId }
      canvas.setPointerCapture(evento.pointerId)
    }
    const aoMover = (evento: PointerEvent) => {
      const { x, y } = local(evento)
      if (inicio && inicio.id === evento.pointerId) {
        const dx = x - inicio.x
        const dy = y - inicio.y
        if (!arrastando && Math.hypot(dx, dy) > 5) { arrastando = true; alvo.rotacao = null; canvas.classList.add('arrastando'); mostrarRotulo(-1, 0, 0) }
        if (arrastando) {
          const sensibilidade = 75 / projecao.scale()
          rotacao[0] = inicio.rotacao[0] + dx * sensibilidade
          rotacao[1] = Math.max(-60, Math.min(60, inicio.rotacao[1] - dy * sensibilidade))
        }
        return
      }
      if (evento.pointerType !== 'mouse') return
      if (estado.current.decorativo) return
      hover = continenteEm(x, y)
      canvas.style.cursor = hover >= 0 ? 'pointer' : 'grab'
      mostrarRotulo(hover, x, y)
    }
    const aoSoltar = (evento: PointerEvent) => {
      if (!inicio || inicio.id !== evento.pointerId) return
      if (!arrastando) {
        const { x, y } = local(evento)
        const indice = continenteEm(x, y)
        if (indice >= 0 && !estado.current.decorativo) estado.current.escolher(indice === estado.current.selecionado ? null : indice)
      }
      inicio = null
      arrastando = false
      canvas.classList.remove('arrastando')
    }
    const aoSair = () => { hover = -1; mostrarRotulo(-1, 0, 0) }

    canvas.addEventListener('pointerdown', aoPressionar)
    canvas.addEventListener('pointermove', aoMover)
    canvas.addEventListener('pointerup', aoSoltar)
    canvas.addEventListener('pointercancel', aoSoltar)
    canvas.addEventListener('pointerleave', aoSair)

    // Só anima enquanto o globo está na tela.
    const observador = new IntersectionObserver(([entrada]) => { visivel = entrada.isIntersecting; if (visivel) animar() })
    observador.observe(caixa)
    const redimensionar = new ResizeObserver(() => { medir(); desenhar(performance.now()) })
    redimensionar.observe(caixa)

    medir()
    gerarPontos().then((lista) => {
      if (cancelado) return
      pontos = lista
      setCarregado(true)
      animar()
    })

    return () => {
      cancelado = true
      cancelAnimationFrame(quadro)
      observador.disconnect()
      redimensionar.disconnect()
      canvas.removeEventListener('pointerdown', aoPressionar)
      canvas.removeEventListener('pointermove', aoMover)
      canvas.removeEventListener('pointerup', aoSoltar)
      canvas.removeEventListener('pointercancel', aoSoltar)
      canvas.removeEventListener('pointerleave', aoSair)
    }
  }, [])

  return <div className={decorativo ? 'globo globo--decorativo' : 'globo'}>
    <div className={carregado ? 'globo-caixa pronto' : 'globo-caixa'} ref={caixaRef}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="globo-rotulo" ref={rotuloRef} hidden />
      {!carregado && <span className="globo-carregando">Carregando o mapa…</span>}
    </div>

    {!decorativo && <>
      <p className="globo-instrucao"><span className="globo-legenda" aria-hidden="true" /> Cada ponto é uma notícia. Arraste para girar e toque num continente para ver as notícias dele.</p>
      <div className="globo-continentes" role="group" aria-label="Notícias por continente">
        {continentes.map((item, indice) => <button type="button" key={item.slug} className={selecionado === indice ? 'active' : undefined} aria-pressed={selecionado === indice} onClick={() => escolher(selecionado === indice ? null : indice)}>
          {item.label} <b>{porContinente[indice].length}</b>
        </button>)}
      </div>
    </>}
  </div>
}
