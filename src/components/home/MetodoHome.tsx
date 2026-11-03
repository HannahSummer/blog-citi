import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Lightbulb, Route, Target } from 'lucide-react'
import { siteConfig } from '../../config/site'

const ICONES = [Target, Route, Lightbulb]

// Metodologia logo abaixo do topo da Home: a trilha se acende e os passos entram em sequência
// quando a seção aparece na tela (com movimento reduzido, já aparece pronta).
export function MetodoHome() {
  const { methodology } = siteConfig
  const secaoRef = useRef<HTMLElement>(null)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const secao = secaoRef.current
    if (!secao) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVisivel(true); return }
    const observador = new IntersectionObserver(([entrada]) => { if (entrada.isIntersecting) { setVisivel(true); observador.disconnect() } }, { threshold: 0.3 })
    observador.observe(secao)
    return () => observador.disconnect()
  }, [])

  return <section className={visivel ? 'home-metodo visivel' : 'home-metodo'} id="metodologia" ref={secaoRef}>
    <div className="home-metodo-luz" aria-hidden="true" />
    <div className="container">
      <div className="home-metodo-topo">
        <span className="eyebrow">{methodology.eyebrow}</span>
        <h2>Começamos pelo <strong>problema.</strong><br /><span>Depois, a tecnologia.</span></h2>
        <p>{methodology.description}</p>
      </div>
      <ol className="home-metodo-trilha">
        {methodology.cards.map(([rotulo, titulo, texto], indice) => {
          const Icone = ICONES[indice] ?? Target
          return <li key={titulo} style={{ '--i': indice } as CSSProperties}>
            <span className="home-metodo-no" aria-hidden="true"><Icone size={20} /></span>
            <span className="home-metodo-numero" aria-hidden="true">{String(indice + 1).padStart(2, '0')}</span>
            <small>{rotulo}</small>
            <h3>{titulo}</h3>
            <p>{texto}</p>
          </li>
        })}
      </ol>
    </div>
  </section>
}
