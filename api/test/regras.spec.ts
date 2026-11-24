// Testes de unidade: regras que não precisam do banco.
import { BadRequestException } from '@nestjs/common'
import { conferirSenha, gerarHash, HASH_FALSO } from '../src/auth/senha'
import { validarEdicao, validarSugestao } from '../src/noticias/validacao'
import { sugestaoValida } from './ajudas'

describe('senhas das editoras (scrypt)', () => {
  it('gera um hash no formato scrypt$salt$hash e confere a senha certa', async () => {
    const hash = await gerarHash('senha-de-teste-123456')
    expect(hash.startsWith('scrypt$')).toBe(true)
    expect(await conferirSenha('senha-de-teste-123456', hash)).toBe(true)
  })

  it('recusa senha errada e hashes malformados', async () => {
    const hash = await gerarHash('senha-de-teste-123456')
    expect(await conferirSenha('outra-senha-qualquer', hash)).toBe(false)
    expect(await conferirSenha('qualquer', 'texto-sem-formato')).toBe(false)
    expect(await conferirSenha('qualquer', 'md5$abc$def')).toBe(false)
  })

  it('o hash falso nunca confere (usado quando o e-mail não existe)', async () => {
    expect(await conferirSenha('senha-de-teste-123456', HASH_FALSO)).toBe(false)
    expect(await conferirSenha('', HASH_FALSO)).toBe(false)
  })

  it('o mesmo texto gera hashes diferentes (salt aleatório)', async () => {
    expect(await gerarHash('senha-igual-123456')).not.toBe(await gerarHash('senha-igual-123456'))
  })
})

describe('validação de edição de notícia (painel)', () => {
  it('aceita campos válidos e devolve só o que foi enviado', () => {
    expect(validarEdicao({ titulo: 'Um título com tamanho adequado', status: 'aprovada' })).toEqual({ titulo: 'Um título com tamanho adequado', status: 'aprovada' })
  })

  it('aceita subtema e continente vazios (viram null)', () => {
    expect(validarEdicao({ subtema: '', continente: '' })).toEqual({ subtema: null, continente: null })
  })

  it('junta todos os problemas numa única mensagem', () => {
    try {
      validarEdicao({ titulo: 'x', categoria: 'nada', link: 'sem-protocolo' })
      throw new Error('deveria ter falhado')
    } catch (erro) {
      expect(erro).toBeInstanceOf(BadRequestException)
      const mensagem = JSON.stringify((erro as BadRequestException).getResponse())
      expect(mensagem).toMatch(/titulo/)
      expect(mensagem).toMatch(/categoria/)
      expect(mensagem).toMatch(/link/)
    }
  })

  it('recusa corpo que não é objeto', () => {
    expect(() => validarEdicao('texto')).toThrow(BadRequestException)
  })
})

describe('validação de sugestão do radar', () => {
  it('aceita uma sugestão completa', () => {
    expect(validarSugestao(sugestaoValida()).sugestao).toBeDefined()
  })

  it('aponta os campos inválidos', () => {
    const r = validarSugestao(sugestaoValida({ titulo: 'x', link: 'ftp://x', categoria: 'nada' }))
    expect(r.erro).toMatch(/titulo/)
    expect(r.erro).toMatch(/link/)
    expect(r.erro).toMatch(/categoria/)
  })

  it('limita a pontuação ao intervalo do banco', () => {
    expect(validarSugestao(sugestaoValida({ pontuacao: 999999 })).sugestao?.pontuacao).toBe(32767)
    expect(validarSugestao(sugestaoValida({ pontuacao: 'nove' })).sugestao?.pontuacao).toBeNull()
  })

  it('recusa item que não é objeto', () => {
    expect(validarSugestao(null).erro).toBeDefined()
  })
})

describe('configuração obrigatória', () => {
  it('não sobe sem JWT_SECRET (ou com um menor que 32 caracteres)', () => {
    const original = process.env.JWT_SECRET
    try {
      jest.resetModules()
      process.env.JWT_SECRET = 'curto'
      expect(() => require('../src/config')).toThrow(/JWT_SECRET/)
      delete process.env.JWT_SECRET
      expect(() => require('../src/config')).toThrow(/JWT_SECRET/)
    } finally {
      process.env.JWT_SECRET = original
      jest.resetModules()
    }
  })
})
