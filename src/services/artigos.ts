import { chamarApi } from '../lib/api'
import type { ArtigoCampos } from '../config/artigos'
import { lerToken } from './painel'

// Publicação de artigos pelo painel: a API cria o arquivo no GitHub e o Coolify publica em seguida.

export interface ConfiguracaoArtigos { configurado: boolean; repositorio: string | null; branch: string }
export interface ArtigoPublicado { slug: string; caminho: string; branch: string; rascunho: boolean; commit: string | null }

export const configuracaoArtigos = () => chamarApi<ConfiguracaoArtigos>('/admin/artigos/configuracao', { token: lerToken() })
export const publicarArtigo = (campos: ArtigoCampos) => chamarApi<ArtigoPublicado>('/admin/artigos', { metodo: 'POST', corpo: campos, token: lerToken() })
