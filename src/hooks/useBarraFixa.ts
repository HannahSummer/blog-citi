import { useEffect, useState } from 'react'

// Diz se uma barra `position: sticky` está grudada no topo da tela. Usado nos filtros do Blog e das
// Notícias: o fundo escuro só aparece quando a barra cobre os cards ao rolar; parada, ela fica transparente.
// Uso: renderize `<div ref={refMarcador} aria-hidden="true" />` logo antes da barra e passe `refBarra` para ela.
export function useBarraFixa() {
  const [marcador, setMarcador] = useState<HTMLElement | null>(null)
  const [barra, setBarra] = useState<HTMLElement | null>(null)
  const [fixada, setFixada] = useState(false)

  useEffect(() => {
    if (!marcador || !barra) return
    // Quando o marcador passa do ponto em que a barra gruda (o `top` dela no CSS), a barra está fixada.
    const topo = parseFloat(getComputedStyle(barra).top) || 0
    const observador = new IntersectionObserver(
      ([entrada]) => setFixada(!entrada.isIntersecting && entrada.boundingClientRect.top < topo + 1),
      { rootMargin: `-${Math.ceil(topo) + 1}px 0px 0px 0px` },
    )
    observador.observe(marcador)
    return () => observador.disconnect()
  }, [marcador, barra])

  return { refMarcador: setMarcador, refBarra: setBarra, fixada }
}
