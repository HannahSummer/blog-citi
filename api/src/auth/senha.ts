import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

// Senhas das editoras com scrypt (nativo do Node, sem dependência extra).
// Formato gravado: scrypt$<salt base64>$<hash base64>.
const scrypt = promisify(scryptCallback) as (senha: string, salt: Buffer, tamanho: number) => Promise<Buffer>
const TAMANHO = 64

export const SENHA_MINIMA = 12

export async function gerarHash(senha: string) {
  const salt = randomBytes(16)
  const hash = await scrypt(senha, salt, TAMANHO)
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`
}

export async function conferirSenha(senha: string, guardado: string) {
  const [algoritmo, salt, hash] = guardado.split('$')
  if (algoritmo !== 'scrypt' || !salt || !hash) return false
  const esperado = Buffer.from(hash, 'base64')
  const calculado = await scrypt(senha, Buffer.from(salt, 'base64'), esperado.length)
  return timingSafeEqual(calculado, esperado)
}

// Usado quando o e-mail não existe, para o login levar o mesmo tempo nos dois casos.
export const HASH_FALSO = 'scrypt$AAAAAAAAAAAAAAAAAAAAAA==$' + Buffer.alloc(TAMANHO).toString('base64')
