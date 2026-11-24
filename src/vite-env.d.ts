/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Endereço da API (sem /api no fim), por exemplo https://api.blog.citi.org.br
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
