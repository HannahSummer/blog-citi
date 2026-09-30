import { Link } from 'react-router-dom'
export function NotFound() { return <section className="not-found container"><span className="eyebrow">404</span><h1>Essa página saiu do <strong>radar.</strong></h1><Link className="button-primary" to="/blog">Voltar para o blog</Link></section> }
