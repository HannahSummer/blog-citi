import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import '@fontsource/inter-tight/300.css'
import '@fontsource/inter-tight/400.css'
import '@fontsource/inter-tight/600.css'
import '@fontsource/inter-tight/700.css'
import './styles/tokens.css'
import './styles/app.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Elemento raiz do aplicativo não encontrado.')
}

createRoot(rootElement).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)