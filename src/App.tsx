import { Navigate, Route, Routes } from 'react-router-dom'
import { SiteLayout } from './layouts/SiteLayout'
import { Home } from './pages/Home'
import { Artigos } from './pages/Artigos'
import { Artigo } from './pages/Artigo'
import { Noticias } from './pages/Noticias'
import { Diagnostico } from './pages/Diagnostico'
import { SobrePagina } from './pages/SobrePagina'
import { Momentos } from './pages/Momentos'
import { Momento } from './pages/Momento'
import { NotFound } from './pages/NotFound'
import { AdminNoticias } from './pages/AdminNoticias'

export default function App() {
  return <Routes><Route element={<SiteLayout />}><Route path="/" element={<Navigate to="/blog" replace />} /><Route path="/blog" element={<Home />} /><Route path="/blog/artigos" element={<Artigos />} /><Route path="/blog/artigos/:slug" element={<Artigo />} /><Route path="/blog/noticias" element={<Noticias />} /><Route path="/blog/diagnostico" element={<Diagnostico />} /><Route path="/blog/admin/noticias" element={<AdminNoticias />} /><Route path="/blog/destaques/*" element={<Navigate to="/blog/sobre" replace />} /><Route path="/blog/sobre/quem-somos" element={<SobrePagina />} /><Route path="/blog/sobre/:slug" element={<Momento />} /><Route path="/blog/sobre" element={<Momentos />} /><Route path="*" element={<NotFound />} /></Route></Routes>
}