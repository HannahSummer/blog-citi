import { Helmet } from 'react-helmet-async'

export function SEO({ title, description, type = 'website', image }: { title: string; description: string; type?: string; image?: string }) {
  return <Helmet><title>{title} | Blog CITi</title><meta name="description" content={description} /><meta property="og:title" content={title} /><meta property="og:description" content={description} /><meta property="og:type" content={type} />{image && <meta property="og:image" content={image} />}<link rel="canonical" href={window.location.href} /></Helmet>
}
