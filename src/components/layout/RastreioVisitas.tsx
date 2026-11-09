import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { registrarVisita } from '../../services/metricas'

// Evita contar a mesma página duas vezes seguidas (o React em modo de desenvolvimento roda o efeito em dobro).
let ultimoRegistro = { caminho: '', quando: 0 }

// Conta cada página aberta no blog, de forma anônima (sem cookie e sem guardar IP).
// Só a primeira página da visita leva a origem (de onde a pessoa veio) e as campanhas (utm_*).
// Não conta o painel interno nem quem pediu ao navegador para não ser rastreado.
export function RastreioVisitas() {
  const { pathname } = useLocation()
  const primeira = useRef(true)

  useEffect(() => {
    if (pathname.startsWith('/blog/admin')) return
    if (navigator.doNotTrack === '1') return
    if (ultimoRegistro.caminho === pathname && Date.now() - ultimoRegistro.quando < 1000) return
    ultimoRegistro = { caminho: pathname, quando: Date.now() }
    const entrada = primeira.current
    primeira.current = false
    const parametros = new URLSearchParams(window.location.search)
    registrarVisita({
      caminho: pathname,
      entrada,
      referrer: entrada ? document.referrer : '',
      utm_source: entrada ? parametros.get('utm_source') ?? '' : '',
      utm_medium: entrada ? parametros.get('utm_medium') ?? '' : '',
      utm_campaign: entrada ? parametros.get('utm_campaign') ?? '' : '',
    })
  }, [pathname])

  return null
}
