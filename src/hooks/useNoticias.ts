import { useEffect, useState } from 'react'
import { news as noticiasMarkdown, type NewsItem } from '../data/noticias'
import { buscarNoticiasPublicadas } from '../services/noticias'

// Uma busca por carregamento da página, compartilhada por todos os componentes.
let pedido: Promise<NewsItem[]> | null = null

function juntar(doBanco: NewsItem[]): NewsItem[] {
  return [...doBanco, ...noticiasMarkdown].sort((a, b) => b.date.localeCompare(a.date))
}

// Notícias do Markdown aparecem na hora; as aprovadas no painel entram assim que o banco responde.
export function useNoticias(): NewsItem[] {
  const [lista, setLista] = useState<NewsItem[]>(noticiasMarkdown)
  useEffect(() => {
    let ativo = true
    pedido ??= buscarNoticiasPublicadas()
    pedido.then((doBanco) => { if (ativo && doBanco.length) setLista(juntar(doBanco)) })
    return () => { ativo = false }
  }, [])
  return lista
}
