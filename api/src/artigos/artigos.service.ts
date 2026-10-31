import { BadGatewayException, BadRequestException, ConflictException, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { ehObjeto, texto } from '../comum/texto'
// Mesmas regras do build (scripts/validar-artigos.ts): se a API aceita, o deploy não quebra.
import { montarMarkdown, slugDoTitulo, validarArtigo, type ArtigoCampos } from '../../../src/config/artigos'

const PASTA = 'src/content/posts'

// Lido a cada chamada (e não no início), para o painel funcionar assim que a variável for cadastrada no Coolify.
export function configuracaoGithub() {
  const token = process.env.GITHUB_TOKEN?.trim() ?? ''
  const repositorio = process.env.GITHUB_REPO?.trim() ?? ''
  const branch = process.env.GITHUB_BRANCH?.trim() || 'main'
  return { token, repositorio, branch, configurado: Boolean(token && /^[\w.-]+\/[\w.-]+$/.test(repositorio)) }
}

const hoje = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Recife' })

export function lerCampos(corpo: unknown): ArtigoCampos {
  if (!ehObjeto(corpo)) throw new BadRequestException({ erro: 'Envio inválido.' })
  return {
    titulo: texto(corpo.titulo),
    resumo: texto(corpo.resumo),
    metaDescription: texto(corpo.metaDescription),
    data: texto(corpo.data) || hoje(),
    categoria: texto(corpo.categoria),
    subtema: texto(corpo.subtema),
    etapaFunil: texto(corpo.etapaFunil),
    ctaTipo: texto(corpo.ctaTipo),
    autor: texto(corpo.autor),
    palavrasChave: texto(corpo.palavrasChave),
    corpo: typeof corpo.corpo === 'string' ? corpo.corpo : '',
    rascunho: corpo.rascunho === true,
  }
}

@Injectable()
export class ArtigosService {
  // Cria src/content/posts/<slug>.md com um commit na branch configurada. O Coolify publica sozinho depois.
  async publicar(corpo: unknown) {
    const github = configuracaoGithub()
    if (!github.configurado) throw new ServiceUnavailableException({ erro: 'A publicação de artigos ainda não foi configurada (GITHUB_TOKEN e GITHUB_REPO na API). Veja docs/12-BACKEND-E-DEPLOY.md.' })

    const campos = lerCampos(corpo)
    const erros = validarArtigo(campos)
    if (Object.keys(erros).length) throw new BadRequestException({ erro: 'Revise os campos destacados.', campos: erros })

    const slug = slugDoTitulo(campos.titulo)
    const caminho = `${PASTA}/${slug}.md`
    const url = `https://api.github.com/repos/${github.repositorio}/contents/${caminho}`
    const cabecalhos = { Authorization: `Bearer ${github.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'blog-citi-api' }

    // Não sobrescreve: um artigo com o mesmo endereço já existe.
    const existente = await fetch(`${url}?ref=${encodeURIComponent(github.branch)}`, { headers: cabecalhos, signal: AbortSignal.timeout(15_000) }).catch(() => null)
    if (!existente) throw new BadGatewayException({ erro: 'Não foi possível falar com o GitHub agora. Tente de novo em instantes.' })
    if (existente.ok) throw new ConflictException({ erro: `Já existe um artigo com o endereço /blog/artigos/${slug}. Mude o título.` })
    if (existente.status !== 404) throw new BadGatewayException({ erro: `O GitHub recusou a consulta (${existente.status}). Confira o token e o repositório.` })

    const resposta = await fetch(url, {
      method: 'PUT',
      headers: { ...cabecalhos, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `conteúdo: ${campos.rascunho ? 'rascunho de artigo' : 'novo artigo'} "${campos.titulo}" (enviado pelo painel)`,
        content: Buffer.from(montarMarkdown(campos), 'utf8').toString('base64'),
        branch: github.branch,
      }),
      signal: AbortSignal.timeout(20_000),
    }).catch(() => null)
    if (!resposta?.ok) throw new BadGatewayException({ erro: `O GitHub não aceitou o artigo${resposta ? ` (${resposta.status})` : ''}. Confira se o token tem permissão de escrita no repositório.` })

    const dados = await resposta.json().catch(() => ({})) as { commit?: { html_url?: string } }
    return { slug, caminho, branch: github.branch, rascunho: campos.rascunho, commit: dados.commit?.html_url ?? null }
  }
}
