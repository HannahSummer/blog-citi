import { BadRequestException } from '@nestjs/common'
import { dataISO, ehObjeto, entre, texto, type Corpo } from '../comum/texto'
// Regras compartilhadas com o site (painel e globo).
import { limitesNoticia, statusNoticia, type StatusNoticia } from '../../../src/config/noticias'
import { categories } from '../../../src/data/categorias'
import { subtemas } from '../../../src/data/subtemas'
import { continentes } from '../../../src/data/continentes'

const LINK = /^https?:\/\//
const categoriaValida = (valor: string) => categories.some((item) => item.slug === valor)
const subtemaValido = (valor: string | null) => valor === null || subtemas.some((item) => item.slug === valor)
const continenteValido = (valor: string | null) => valor === null || continentes.some((item) => item.slug === valor)
const opcional = (valor: unknown) => texto(valor) || null

export interface CamposEditaveis { titulo?: string; resumo?: string; por_que_importa?: string; categoria?: string; subtema?: string | null; continente?: string | null; link?: string; status?: StatusNoticia }

// Edição no painel: só os campos enviados; cada um é conferido.
export function validarEdicao(corpo: unknown): CamposEditaveis {
  if (!ehObjeto(corpo)) throw new BadRequestException({ erro: 'Envio inválido.' })
  const campos: CamposEditaveis = {}
  const problemas: string[] = []
  for (const campo of ['titulo', 'resumo', 'por_que_importa'] as const) {
    if (corpo[campo] === undefined) continue
    const valor = texto(corpo[campo])
    campos[campo] = valor
    if (!entre(valor, limitesNoticia[campo])) problemas.push(`${campo}: entre ${limitesNoticia[campo][0]} e ${limitesNoticia[campo][1]} caracteres.`)
  }
  if (corpo.categoria !== undefined) {
    campos.categoria = texto(corpo.categoria)
    if (!categoriaValida(campos.categoria)) problemas.push('categoria inválida.')
  }
  if (corpo.subtema !== undefined) {
    campos.subtema = opcional(corpo.subtema)
    if (!subtemaValido(campos.subtema)) problemas.push('subtema inválido.')
  }
  if (corpo.continente !== undefined) {
    campos.continente = opcional(corpo.continente)
    if (!continenteValido(campos.continente)) problemas.push('continente inválido.')
  }
  if (corpo.link !== undefined) {
    campos.link = texto(corpo.link)
    if (!LINK.test(campos.link)) problemas.push('link: use o endereço completo, com https://.')
  }
  if (corpo.status !== undefined) {
    if (statusNoticia.includes(corpo.status as StatusNoticia)) campos.status = corpo.status as StatusNoticia
    else problemas.push('status inválido.')
  }
  if (problemas.length) throw new BadRequestException({ erro: problemas.join(' ') })
  return campos
}

// Segunda-feira da semana atual (AAAA-MM-DD), como o radar usa para agrupar as sugestões.
function segundaDaSemana(hoje = new Date()) {
  const segunda = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()))
  segunda.setUTCDate(segunda.getUTCDate() - ((segunda.getUTCDay() + 6) % 7))
  return segunda.toISOString().slice(0, 10)
}

// Notícia cadastrada à mão no painel: mesmas regras das sugestões do radar. O que só o radar
// teria (semana, título original da fonte, motivo) é preenchido aqui.
export function validarNovaNoticia(corpo: unknown) {
  if (!ehObjeto(corpo)) return { sugestao: undefined, erro: 'Envio inválido.' }
  return validarSugestao({
    ...corpo,
    semana: segundaDaSemana(),
    titulo_original: texto(corpo.titulo),
    trecho_feed: null,
    motivo: 'Cadastrada manualmente no painel',
    pontuacao: null,
  })
}

// Sugestão nova vinda do radar: todos os campos obrigatórios conferidos.
export function validarSugestao(item: unknown) {
  if (!ehObjeto(item)) return { erro: 'item inválido' }
  const s: Corpo = item
  const semana = dataISO(s.semana)
  const sugestao = {
    semana: semana ?? new Date(0),
    titulo: texto(s.titulo),
    resumo: texto(s.resumo),
    por_que_importa: texto(s.por_que_importa),
    categoria: texto(s.categoria),
    subtema: opcional(s.subtema),
    continente: opcional(s.continente),
    fonte: texto(s.fonte),
    link: texto(s.link),
    data_fonte: dataISO(s.data_fonte),
    titulo_original: texto(s.titulo_original),
    trecho_feed: opcional(s.trecho_feed),
    motivo: opcional(s.motivo),
    pontuacao: typeof s.pontuacao === 'number' && Number.isInteger(s.pontuacao) ? Math.max(-32768, Math.min(32767, s.pontuacao)) : null,
  }
  const problemas = [
    !semana && 'semana (AAAA-MM-DD)',
    !entre(sugestao.titulo, limitesNoticia.titulo) && 'titulo',
    !entre(sugestao.resumo, limitesNoticia.resumo) && 'resumo',
    !entre(sugestao.por_que_importa, limitesNoticia.por_que_importa) && 'por_que_importa',
    !categoriaValida(sugestao.categoria) && 'categoria',
    !subtemaValido(sugestao.subtema) && 'subtema',
    !continenteValido(sugestao.continente) && 'continente',
    !entre(sugestao.fonte, limitesNoticia.fonte) && 'fonte',
    !LINK.test(sugestao.link) && 'link',
    !sugestao.titulo_original && 'titulo_original',
  ].filter(Boolean)
  return problemas.length ? { erro: `campos inválidos: ${problemas.join(', ')}` } : { sugestao }
}
