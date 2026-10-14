import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { sobreConfig } from '../../config/sobre'

export function SobreCarrossel() {
  const slides = sobreConfig.carrossel
  const labels = sobreConfig.carrosselLabels
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const touchStart = useRef<number | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (paused || reducedMotion || slides.length < 2) return
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6000)
    return () => window.clearInterval(timer)
  }, [paused, reducedMotion, slides.length])

  const move = (direction: number) => setActive((current) => (current + direction + slides.length) % slides.length)
  const current = slides[active]
  return <section className="sobre-carousel" aria-label="Fotos do CITi" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false) }} onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientX ?? null }} onTouchEnd={(event) => { if (touchStart.current === null) return; const distance = (event.changedTouches[0]?.clientX ?? 0) - touchStart.current; if (Math.abs(distance) >= 40) move(distance < 0 ? 1 : -1); touchStart.current = null }}>
    {slides.map((slide, index) => <img className={index === active ? 'sobre-carousel-image active' : 'sobre-carousel-image'} src={slide.src} alt={slide.alt} width={1600} height={900} loading={index === 0 ? undefined : 'lazy'} ref={(element) => { if (index === 0) element?.setAttribute('fetchpriority', 'high') }} key={slide.src} />)}
    <div className="sobre-carousel-gradient sobre-carousel-gradient-bottom" aria-hidden="true" /><div className="sobre-carousel-gradient sobre-carousel-gradient-side" aria-hidden="true" />
    <div className="sobre-carousel-content container"><span className="eyebrow">{current.eyebrow}</span><p>{current.legenda}</p></div>
    {slides.length > 1 && <div className="sobre-carousel-controls"><button className="carousel-button" type="button" onClick={() => move(-1)} aria-label={labels.previous}><ChevronLeft size={20} /></button><div className="carousel-dots">{slides.map((slide, index) => <button className={index === active ? 'carousel-dot active' : 'carousel-dot'} type="button" aria-label={`Ir para foto ${index + 1}`} aria-current={index === active ? 'true' : undefined} onClick={() => setActive(index)} key={slide.src} />)}</div><button className="carousel-button" type="button" onClick={() => move(1)} aria-label={labels.next}><ChevronRight size={20} /></button><button className="carousel-button" type="button" onClick={() => setPaused((currentPaused) => !currentPaused)} aria-label={paused ? labels.resume : labels.pause} aria-pressed={paused}>{paused ? <Play size={17} /> : <Pause size={17} />}</button></div>}
  </section>
}
