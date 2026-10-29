/**
 * Capas generativas do blog: cada subtema tem um padrão próprio (linhas, pontos, anéis...)
 * sobre o degradê azul → verde da marca, com granulado. A semente vem do slug, então cada
 * artigo tem uma variação única e a mesma capa sai igual toda vez que o script roda.
 */

export const LARGURA = 1600
export const ALTURA = 900

export type Padrao = 'faixas' | 'pontos' | 'leque' | 'onda' | 'aneis' | 'fita' | 'pixels' | 'curvas' | 'degraus'

// Um padrão por subtema; a capa padrão da categoria usa o padrão do primeiro subtema dela.
export const PADRAO_DO_SUBTEMA: Record<string, Padrao> = {
  marketing: 'onda',
  vendas: 'leque',
  dados: 'pontos',
  desenvolvimento: 'faixas',
  inovacao: 'aneis',
  'experiencia-do-cliente': 'fita',
  'gestao-empresarial': 'curvas',
  'big-techs': 'pixels',
  financas: 'degraus',
}
export const PADRAO_DA_CATEGORIA: Record<string, Padrao> = { negocios: 'onda', solucoes: 'pontos', gestao: 'curvas' }

const PALETAS: Record<string, [string, string, string, string]> = {
  negocios: ['#3d63e0', '#2bb3a6', '#22d17a', '#00db59'],
  solucoes: ['#3a6ee8', '#2cc0b0', '#28d88a', '#00db59'],
  gestao: ['#3557d1', '#2aa89e', '#36d989', '#9ef0bd'],
}

function sementeDe(texto: string) {
  let h = 2166136261
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

// mulberry32: aleatório determinístico a partir da semente.
function aleatorio(semente: number) {
  let a = semente
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const n = (valor: number) => Math.round(valor * 10) / 10

type Rnd = () => number
const W = LARGURA
const H = ALTURA

function faixas(r: Rnd) {
  // Bandas horizontais com hachura diagonal que terminam em degraus, como um glitch.
  let y = 0
  let rects = ''
  while (y < H) {
    const altura = 40 + r() * 120
    const fim = W * (0.55 + r() * 0.45) - (y / H) * W * 0.35
    rects += `<rect x="${n(r() < 0.25 ? r() * 120 : 0)}" y="${n(y)}" width="${n(fim)}" height="${n(altura - 3)}" fill="url(#hachura)"/>`
    if (r() < 0.35) rects += `<rect x="${n(W - 40 - r() * 120)}" y="${n(y)}" width="200" height="${n(altura - 3)}" fill="url(#hachura)"/>`
    y += altura
  }
  return `<defs><pattern id="hachura" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(${n(-30 - r() * 20)})"><rect width="8" height="16" fill="#fff"/></pattern><mask id="m">${rects}</mask></defs><rect width="${W}" height="${H}" fill="url(#cor)" mask="url(#m)"/>`
}

function pontos(r: Rnd) {
  // Grade de pontos que cresce num anel em volta de um "buraco" com brilho.
  const cx = W * (0.55 + r() * 0.15)
  const cy = H * (0.45 + r() * 0.1)
  const raio = 230 + r() * 60
  let circulos = ''
  for (let x = 20; x < W; x += 34) {
    for (let y = 20; y < H; y += 34) {
      const d = Math.hypot(x - cx, y - cy)
      if (d < raio) continue
      const tamanho = Math.max(1.2, 7.5 * Math.exp(-((d - raio) ** 2) / (2 * 200 ** 2)))
      circulos += `<circle cx="${x}" cy="${y}" r="${n(tamanho)}"/>`
    }
  }
  return `<g fill="url(#cor)">${circulos}</g><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(raio * 0.95)}" fill="url(#buraco)"/><defs><radialGradient id="buraco" cx="${n(0.5 + r() * 0.1)}" cy="0.55" r="0.5"><stop offset="0" stop-color="#b9f5cf" stop-opacity=".9"/><stop offset=".12" stop-color="#2f7a4a" stop-opacity=".7"/><stop offset=".7" stop-color="#0b1a12" stop-opacity=".95"/><stop offset="1" stop-color="#05070a" stop-opacity="0"/></radialGradient></defs>`
}

function leque(r: Rnd) {
  // Leque de linhas em espiral saindo de um miolo.
  const cx = W * (0.32 + r() * 0.12)
  const cy = H * (0.48 + r() * 0.1)
  const inicio = r() * Math.PI * 2
  let linhas = ''
  const total = 150
  for (let i = 0; i < total; i++) {
    const t = i / total
    const angulo = inicio + t * Math.PI * 1.75
    const r1 = 110 + t * 60
    const r2 = r1 + 260 + t * 520
    linhas += `<line x1="${n(cx + Math.cos(angulo) * r1)}" y1="${n(cy + Math.sin(angulo) * r1)}" x2="${n(cx + Math.cos(angulo) * r2)}" y2="${n(cy + Math.sin(angulo) * r2)}"/>`
  }
  return `<g stroke="url(#cor)" stroke-width="5" stroke-linecap="butt">${linhas}</g>`
}

function onda(r: Rnd) {
  // Barras verticais cujo topo desenha uma onda; uma cópia escura dá profundidade.
  const f1 = 1 + r() * 1.5
  const f2 = 2.5 + r() * 2
  const fase = r() * 6
  let barras = ''
  let sombras = ''
  for (let x = -10; x < W; x += 24) {
    const t = x / W
    const topo = H * (0.42 + 0.22 * Math.sin(t * Math.PI * f1 + fase) + 0.06 * Math.sin(t * Math.PI * f2))
    sombras += `<rect x="${n(x + 7)}" y="${n(topo + 10)}" width="14" height="${n(H - topo)}"/>`
    barras += `<rect x="${n(x)}" y="${n(topo)}" width="14" height="${n(H - topo)}" transform="skewX(-8)"/>`
  }
  return `<g fill="#05070a" opacity=".55" transform="skewX(-8)">${sombras}</g><g fill="url(#cor)">${barras}</g>`
}

function aneis(r: Rnd) {
  // Arcos concêntricos cortados por uma diagonal.
  const cx = W * (0.62 + r() * 0.1)
  const cy = H * (0.52 + r() * 0.12)
  const corte = -0.9 - r() * 0.5
  let arcos = ''
  for (let raio = 90; raio < 1500; raio += 30) {
    const a1 = corte
    const a2 = corte + Math.PI * 1.25
    const x1 = cx + Math.cos(a1) * raio
    const y1 = cy + Math.sin(a1) * raio
    const x2 = cx + Math.cos(a2) * raio
    const y2 = cy + Math.sin(a2) * raio
    arcos += `<path d="M${n(x1)} ${n(y1)}A${raio} ${raio} 0 1 0 ${n(x2)} ${n(y2)}"/>`
  }
  return `<g fill="none" stroke="url(#cor)" stroke-width="20">${arcos}</g>`
}

function fita(r: Rnd) {
  // Fita torcida: linhas finas ligando duas curvas.
  const a = (t: number) => [t * W * 1.1 - 60, H * (0.35 + 0.25 * Math.sin(t * Math.PI * 1.4 + 0.6))] as const
  const b = (t: number) => [t * W * 1.1 - 60, H * (0.8 + 0.08 * Math.sin(t * Math.PI * 2 + 2))] as const
  const giro = 0.15 + r() * 0.2
  let linhas = ''
  for (let i = 0; i <= 220; i++) {
    const t = i / 220
    const [x1, y1] = a(t)
    const [x2, y2] = b(Math.min(1, Math.max(0, t + giro * Math.sin(t * Math.PI))))
    linhas += `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"/>`
  }
  return `<g stroke="url(#cor)" stroke-width="2.4">${linhas}</g>`
}

function pixels(r: Rnd) {
  // Fileiras de pontos desfocados que entram pela esquerda e pela direita.
  let pontosHtml = ''
  for (let linha = 0, y = 30; y < H; linha++, y += 58) {
    const ladoDireito = r() < 0.5 || linha > 4
    const comprimento = W * (0.2 + r() * 0.6)
    const inicio = ladoDireito ? W - comprimento : 0
    for (let x = inicio; x < inicio + comprimento; x += 34) pontosHtml += `<circle cx="${n(x)}" cy="${y}" r="11"/>`
  }
  return `<defs><filter id="desfoque"><feGaussianBlur stdDeviation="3.5"/></filter></defs><g fill="url(#cor)" filter="url(#desfoque)">${pontosHtml}</g>`
}

function curvas(r: Rnd) {
  // Faixas largas e paralelas que descrevem uma curva.
  const c1 = H * (0.1 + r() * 0.2)
  const c2 = H * (0.3 + r() * 0.3)
  let faixasHtml = ''
  for (let i = 0; i < 34; i++) {
    const d = i * 30
    faixasHtml += `<path d="M-50 ${n(80 + d)}C${n(W * 0.3)} ${n(c1 + d + 160)} ${n(W * 0.7)} ${n(c2 + d)} ${W + 50} ${n(-60 + d)}"/>`
  }
  return `<g fill="none" stroke="#05070a" stroke-width="4" opacity=".75">${faixasHtml}</g><g fill="none" stroke="url(#cor)" stroke-width="24" style="mix-blend-mode:screen" opacity=".9">${faixasHtml}</g>`
}

function degraus(r: Rnd) {
  // Colunas que sobem em degraus, feitas de linhas horizontais (um gráfico abstrato).
  let linhas = ''
  const colunas = 9
  const largura = W / colunas
  for (let i = 0; i < colunas; i++) {
    const altura = H * (0.18 + (i / colunas) * 0.62 + (r() - 0.5) * 0.12)
    for (let y = H - 14; y > H - altura; y -= 14) linhas += `<rect x="${n(i * largura + 10)}" y="${y}" width="${n(largura - 20)}" height="6"/>`
  }
  return `<g fill="url(#cor)">${linhas}</g>`
}

const DESENHOS: Record<Padrao, (r: Rnd) => string> = { faixas, pontos, leque, onda, aneis, fita, pixels, curvas, degraus }

export function desenharCapa({ slug, categoria, padrao }: { slug: string; categoria: string; padrao: Padrao }): string {
  const r = aleatorio(sementeDe(slug))
  const [c1, c2, c3, c4] = PALETAS[categoria] ?? PALETAS.solucoes
  const angulo = r() * 40 - 20
  // Espelhar metade das capas evita que artigos do mesmo subtema fiquem iguais.
  const espelho = r() < 0.5 ? ` transform="translate(${W} 0) scale(-1 1)"` : ''
  // Manchas de luz ao fundo, como nas referências.
  // Uma mancha azul de um lado; o resto é verde.
  const manchas = [[c1, 0.12, 0.15], [c3, 0.75, 0.3], [c4, 0.9, 0.9], [c4, 0.35, 0.95]]
    .map(([cor, x, y]) => `<circle cx="${n(W * (x as number) + (r() - 0.5) * 300)}" cy="${n(H * (y as number) + (r() - 0.5) * 200)}" r="${n(320 + r() * 200)}" fill="${cor}" opacity="${n(0.25 + r() * 0.25)}"/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<linearGradient id="cor" gradientUnits="userSpaceOnUse" x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}" gradientTransform="rotate(${n(angulo)} ${W / 2} ${H / 2})"><stop offset="0" stop-color="${c1}"/><stop offset=".2" stop-color="${c2}"/><stop offset=".5" stop-color="${c3}"/><stop offset="1" stop-color="${c4}"/></linearGradient>
<filter id="luz" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="120"/></filter>
<filter id="grao"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".55"/></feComponentTransfer></filter>
</defs>
<rect width="${W}" height="${H}" fill="#06080c"/>
<g filter="url(#luz)">${manchas}</g>
<g${espelho}>${DESENHOS[padrao](r)}</g>
<rect width="${W}" height="${H}" filter="url(#grao)" style="mix-blend-mode:overlay" opacity=".7"/>
</svg>`
}

// Texto alternativo de cada padrão, para o `cover_alt` dos artigos.
export const ALT_DO_PADRAO: Record<Padrao, string> = {
  onda: 'Ilustração abstrata de barras verticais que formam uma onda, em degradê azul e verde',
  leque: 'Ilustração abstrata de linhas em leque que formam uma espiral, em degradê azul e verde',
  pontos: 'Ilustração abstrata de uma grade de pontos ao redor de um círculo escuro, em azul e verde',
  faixas: 'Ilustração abstrata de faixas com hachuras diagonais, em degradê azul e verde',
  aneis: 'Ilustração abstrata de arcos concêntricos, em degradê azul e verde',
  fita: 'Ilustração abstrata de uma fita torcida de linhas finas, em degradê azul e verde',
  pixels: 'Ilustração abstrata de fileiras de pontos luminosos, em azul e verde',
  curvas: 'Ilustração abstrata de faixas curvas e paralelas, em degradê azul e verde',
  degraus: 'Ilustração abstrata de colunas que sobem em degraus, em degradê azul e verde',
}
