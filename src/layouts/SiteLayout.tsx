import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'

function ScrollToHash() {
  const location = useLocation()
  useEffect(() => {
    const target = location.hash ? document.getElementById(location.hash.slice(1)) : null
    if (target) window.setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname, location.hash])
  return null
}

export function SiteLayout() { return <><ScrollToHash /><SiteHeader /><main className="site-main"><Outlet /></main><SiteFooter /></> }
