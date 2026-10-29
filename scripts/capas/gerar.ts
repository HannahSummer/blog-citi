/**
 * Gera as capas dos artigos em public/images/covers/<slug>.webp (1600x900), mais as capas
 * padrão das categorias. Desenha o SVG de estilos.ts e fotografa no Chrome headless.
 *
 * Uso:
 *   npm run capas                 # só cria as capas que ainda não existem
 *   npm run capas -- --forcar     # refaz todas
 *   npm run capas -- --so <slug>  # refaz uma (útil para testar outra variação)
 *
 * Capa feita à mão? Salve com o mesmo nome em public/images/covers/ e o script não a substitui.
 * Precisa do Google Chrome instalado (ou CHROME_PATH apontando para ele) e Node 22+.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseFrontMatter } from '../../src/lib/frontMatter'
import { ALTURA, desenharCapa, LARGURA, PADRAO_DA_CATEGORIA, PADRAO_DO_SUBTEMA, type Padrao } from './estilos'

const raiz = process.cwd()
const pastaPosts = join(raiz, 'src', 'content', 'posts')
const pastaCapas = join(raiz, 'public', 'images', 'covers')
const args = process.argv.slice(2)
const forcar = args.includes('--forcar')
const so = args.includes('--so') ? args[args.indexOf('--so') + 1] : undefined

interface Pedido { arquivo: string; slug: string; categoria: string; padrao: Padrao }

const pedidos: Pedido[] = []
for (const nome of readdirSync(pastaPosts).filter((item) => item.endsWith('.md'))) {
  const { metadata } = parseFrontMatter(readFileSync(join(pastaPosts, nome), 'utf8'))
  const capa = String(metadata.cover ?? '')
  if (!capa.startsWith('/images/covers/') || metadata.draft === true) continue
  const categoria = String(metadata.categoria ?? 'solucoes')
  const padrao = PADRAO_DO_SUBTEMA[String(metadata.subtema ?? '')] ?? PADRAO_DA_CATEGORIA[categoria] ?? 'pontos'
  pedidos.push({ arquivo: join(raiz, 'public', capa), slug: nome.replace('.md', ''), categoria, padrao })
}
for (const [categoria, padrao] of Object.entries(PADRAO_DA_CATEGORIA)) pedidos.push({ arquivo: join(pastaCapas, 'categorias', `${categoria}.webp`), slug: `categoria-${categoria}`, categoria, padrao })

const fila = pedidos.filter((pedido) => (so ? pedido.slug === so : forcar || !existsSync(pedido.arquivo)))
if (!fila.length) { console.log(so ? `Nenhum artigo publicado com o slug "${so}" e capa em /images/covers/.` : 'Todas as capas já existem. Use --forcar para refazer.'); process.exit(0) }

const caminhoChrome = process.env.CHROME_PATH ?? ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(existsSync)
if (!caminhoChrome) throw new Error('Chrome não encontrado. Defina CHROME_PATH.')
const porta = 9400 + Math.floor(Math.random() * 400)
const chrome = spawn(caminhoChrome, ['--headless=new', '--hide-scrollbars', `--remote-debugging-port=${porta}`, `--user-data-dir=${join(tmpdir(), `capas-${porta}`)}`, 'about:blank'], { stdio: 'ignore' })
const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let ws: WebSocket | undefined
for (let tentativa = 0; tentativa < 40 && !ws; tentativa++) {
  try {
    const paginas = await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json() as Array<{ type: string; webSocketDebuggerUrl: string }>
    const pagina = paginas.find((item) => item.type === 'page')
    if (pagina) ws = new WebSocket(pagina.webSocketDebuggerUrl)
  } catch { await esperar(250) }
}
if (!ws) throw new Error('Não consegui conectar ao Chrome.')
const conexao = ws
await new Promise((resolve) => conexao.addEventListener('open', resolve))
let id = 0
const pendentes = new Map<number, (resultado: any) => void>()
conexao.addEventListener('message', (evento) => { const msg = JSON.parse(String(evento.data)); if (msg.id && pendentes.has(msg.id)) { pendentes.get(msg.id)!(msg.result); pendentes.delete(msg.id) } })
const cmd = (method: string, params: object = {}) => new Promise<any>((resolve) => { const atual = ++id; pendentes.set(atual, resolve); conexao.send(JSON.stringify({ id: atual, method, params })) })

await cmd('Emulation.setDeviceMetricsOverride', { width: LARGURA, height: ALTURA, deviceScaleFactor: 1, mobile: false })
for (const pedido of fila) {
  const svg = desenharCapa(pedido)
  await cmd('Runtime.evaluate', { expression: `document.documentElement.innerHTML = ${JSON.stringify(`<body style="margin:0;background:#06080c">${svg}</body>`)}` })
  await esperar(150)
  const foto = await cmd('Page.captureScreenshot', { format: 'webp', quality: 82, clip: { x: 0, y: 0, width: LARGURA, height: ALTURA, scale: 1 } })
  mkdirSync(join(pedido.arquivo, '..'), { recursive: true })
  writeFileSync(pedido.arquivo, Buffer.from(foto.data, 'base64'))
  console.log(`capa ${pedido.padrao.padEnd(7)} ${pedido.arquivo.replace(raiz, '.')}`)
}
conexao.close()
chrome.kill()
