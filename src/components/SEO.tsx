import { Helmet } from 'react-helmet-async'

export function SEO({ title, description, type = 'website' }: { title: string; description: string; type?: string }) {
  return <Helmet><title>{title} | Blog CITi</title><meta name="description" content={description} /><meta property="og:title" content={title} /><meta property="og:description" content={description} /><meta property="og:type" content={type} /><link rel="canonical" href={window.location.href} /></Helmet>
}
