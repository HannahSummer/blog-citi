import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { marked } from 'marked'
// Mesma análise do plugin Yoast SEO para WordPress (pacote oficial yoastseo), rodando nos artigos em Markdown.
import { ContentAssessor, Paper, SeoAssessor } from 'yoastseo'
import PortugueseResearcher from 'yoastseo/build/languageProcessing/languages/pt/Researcher.js'
import { parseFrontMatter } from '../../src/lib/frontMatter'

// Uso: npm run seo                  → resumo de todos os artigos publicados
//      npm run seo -- <slug>        → detalhes de um artigo (o que melhorar)
// A frase-chave é a primeira de `palavras_chave`. O Yoast é uma orientação, não uma regra:
// não quebra o build, e um texto claro para o leitor vale mais que uma nota verde.

type Resultado = { getIdentifier: () => string; getScore: () => number; getText: () => string }
type Avaliador = { assess: (paper: unknown) => void; getValidResults: () => Resultado[]; calculateOverallScore: () => number }

const postsDirectory = join(process.cwd(), 'src', 'content', 'posts')
const Researcher = (PortugueseResearcher as unknown as { default?: new (paper: unknown) => unknown }).default ?? (PortugueseResearcher as unknown as new (paper: unknown) => unknown)

// Nome de cada verificação em português (o pacote só traz os textos em inglês).
const nomes: Record<string, string> = {
  introductionKeyword: 'Frase-chave no primeiro parágrafo',
  keyphraseLength: 'Tamanho da frase-chave',
  keyphraseDensity: 'Frase-chave repetida no texto',
  metaDescriptionKeyword: 'Frase-chave na meta description',
  metaDescriptionLength: 'Tamanho da meta description',
  subheadingsKeyword: 'Frase-chave nos subtítulos',
  textCompetingLinks: 'Links que competem pela frase-chave',
  imageKeyphrase: 'Frase-chave no texto alternativo da capa',
  images: 'Imagens',
  textLength: 'Tamanho do texto',
  externalLinks: 'Links para outros sites (fontes)',
  keyphraseInSEOTitle: 'Frase-chave no título',
  internalLinks: 'Links para outros artigos do blog',
  titleWidth: 'Tamanho do título',
  slugKeyword: 'Frase-chave no endereço (slug)',
  singleH1: 'Um único título principal',
  subheadingsTooLong: 'Distribuição dos subtítulos',
  textParagraphTooLong: 'Tamanho dos parágrafos',
  textSentenceLength: 'Tamanho das frases',
  textTransitionWords: 'Palavras de transição',
  passiveVoice: 'Voz passiva',
  textPresence: 'Texto presente',
  sentenceBeginnings: 'Frases começando igual',
}

// O que fazer quando a verificação não está verde (o texto original do pacote, em inglês, fica entre parênteses).
const dicas: Record<string, string> = {
  introductionKeyword: 'use a frase-chave no primeiro parágrafo, para o assunto ficar claro logo de início',
  keyphraseLength: 'use uma frase-chave de 1 a 4 palavras, a forma como as pessoas buscam',
  keyphraseDensity: 'repita a frase-chave algumas vezes ao longo do texto, sem forçar',
  metaDescriptionKeyword: 'inclua a frase-chave na meta_description',
  metaDescriptionLength: 'deixe a meta_description entre 120 e 156 caracteres',
  subheadingsKeyword: 'use a frase-chave (ou parte dela) em pelo menos um subtítulo ##',
  textCompetingLinks: 'evite links com a própria frase-chave no texto do link',
  imageKeyphrase: 'a capa é uma ilustração abstrata; o texto alternativo deve descrevê-la, então pode ignorar este item',
  images: 'confira se o artigo tem capa',
  textLength: 'o texto está curto; o guia recomenda de 800 a 1.400 palavras',
  externalLinks: 'cite uma fonte externa com link quando houver dado, pesquisa ou ferramenta mencionada',
  keyphraseInSEOTitle: 'coloque a frase-chave no título, de preferência no começo',
  internalLinks: 'inclua links para outros artigos do blog',
  titleWidth: 'ajuste o tamanho do título (até 65 caracteres)',
  slugKeyword: 'use a frase-chave no nome do arquivo (só antes de publicar: mudar depois quebra links)',
  singleH1: 'não use # no corpo; o título já é o título principal',
  subheadingsTooLong: 'divida trechos longos com mais subtítulos ##',
  textParagraphTooLong: 'quebre parágrafos longos (até umas 150 palavras)',
  textSentenceLength: 'encurte frases longas (mais de 20 palavras)',
  textTransitionWords: 'use mais palavras de ligação: porém, por isso, além disso, por exemplo, assim, no entanto',
  passiveVoice: 'prefira a voz ativa ("a equipe fez" em vez de "foi feito pela equipe")',
  sentenceBeginnings: 'evite várias frases seguidas começando com a mesma palavra',
}

// Mesmas cores do plugin: 8 a 10 bom, 5 a 7 pode melhorar, até 4 problema.
const cor = (nota: number) => (nota >= 8 ? '🟢' : nota >= 5 ? '🟠' : '🔴')
const corGeral = (nota: number) => (nota >= 70 ? '🟢' : nota >= 40 ? '🟠' : '🔴')
const semHtml = (texto: string) => texto.replace(/<[^>]+>/g, '')

function analisar(arquivo: string) {
  const { metadata, content } = parseFrontMatter(readFileSync(join(postsDirectory, arquivo), 'utf8'))
  const slug = arquivo.replace(/\.md$/, '')
  const titulo = String(metadata.title ?? '')
  const capa = metadata.cover ? `<img src="${metadata.cover}" alt="${String(metadata.cover_alt ?? '')}">` : ''
  // A página real tem o título (h1) e a capa antes do texto.
  const html = `<h1>${titulo}</h1>${capa}${marked.parse(content, { async: false })}`
  const fraseChave = String(metadata.palavras_chave ?? '').split(',')[0].trim()
  const paper = new Paper(html, { keyword: fraseChave, title: titulo, description: String(metadata.meta_description ?? ''), slug, locale: 'pt_BR', titleWidth: titulo.length * 9 })
  const researcher = new Researcher(paper)
  const avaliar = (Classe: unknown) => {
    const avaliador = new (Classe as new (researcher: unknown) => Avaliador)(researcher)
    avaliador.assess(paper)
    return avaliador
  }
  return { slug, fraseChave, rascunho: metadata.draft === true || metadata.draft === 'true', seo: avaliar(SeoAssessor), legibilidade: avaliar(ContentAssessor) }
}

const filtro = process.argv[2]
const arquivos = readdirSync(postsDirectory).filter((arquivo) => arquivo.endsWith('.md') && (!filtro || arquivo === `${filtro}.md`))
if (!arquivos.length) { console.error(`Nenhum artigo encontrado${filtro ? ` com o slug "${filtro}"` : ''}.`); process.exit(1) }

for (const analise of arquivos.map(analisar).filter((analise) => filtro || !analise.rascunho)) {
  const notaSeo = analise.seo.calculateOverallScore()
  const notaLeitura = analise.legibilidade.calculateOverallScore()
  console.log(`\n${corGeral(notaSeo)} SEO ${String(notaSeo).padStart(3)}  ${corGeral(notaLeitura)} Legibilidade ${String(notaLeitura).padStart(3)}  ${analise.slug}  (frase-chave: "${analise.fraseChave}")`)
  // Sem slug, mostra só o que precisa de atenção; com slug, mostra tudo.
  for (const resultado of [...analise.seo.getValidResults(), ...analise.legibilidade.getValidResults()]) {
    if (!filtro && resultado.getScore() >= 8) continue
    const nome = nomes[resultado.getIdentifier()] ?? resultado.getIdentifier()
    const ok = resultado.getScore() >= 8
    const detalhe = ok ? 'ok' : `${dicas[resultado.getIdentifier()] ?? ''} (${semHtml(resultado.getText()).replace(/^[^:]+:\s*/, '')})`
    console.log(`   ${cor(resultado.getScore())} ${nome}${filtro ? `: ${detalhe}` : ''}`)
  }
}
console.log('\nNotas de 0 a 100, como no plugin Yoast. Para ver os detalhes de um artigo: npm run seo -- <slug>')
