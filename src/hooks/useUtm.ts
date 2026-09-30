import { useEffect, useState } from 'react'

export interface UtmParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
}

export function useUtm(): UtmParams {
  const [params, setParams] = useState<UtmParams>({})

  useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    const keys: Array<keyof UtmParams> = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
    const current = Object.fromEntries(keys.flatMap((key) => search.get(key) ? [[key, search.get(key) as string]] : [])) as UtmParams
    const stored = sessionStorage.getItem('citi-utm')
    const merged = stored ? { ...JSON.parse(stored), ...current } : current
    if (Object.keys(merged).length > 0) sessionStorage.setItem('citi-utm', JSON.stringify(merged))
    setParams(merged)
  }, [])

  return params
}
