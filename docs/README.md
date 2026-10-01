# Documentação do Blog do CITi

> Protótipo em React + TypeScript. Os caminhos citados aqui seguem a estrutura definida no prompt de estrutura (`src/content/`, `src/data/`, `src/config/site.ts`). Se algum arquivo tiver outro nome no seu projeto, ajuste a referência aqui.

## Índice

| Documento | Para quem | O que responde |
|---|---|---|
| [01 — Guia de conteúdo](01-GUIA-DE-CONTEUDO.md) | Quem escreve e publica | Onde ficam os posts, como criar um, checklist de publicação |
| [02 — Notícias](02-NOTICIAS.md) | Curadoria | Estrutura das notícias, regras editoriais e de direito autoral, rotina semanal |
| [03 — Radar automático](03-RADAR-AUTOMATICO.md) | Curadoria + dev | Como o script busca notícias, como rodar, configurar e agendar |
| [04 — Estratégia editorial](04-ESTRATEGIA-EDITORIAL.md) | Marketing, Gerente, CRO | Mapa de conteúdo, temas prioritários, primeiras pautas, como pesquisar |
| [05 — Diagnóstico e leads](05-DIAGNOSTICO-E-LEADS.md) | Comercial + dev | Configuração do Supabase, testes, LGPD e pendências de produção |

## Como o blog funciona (visão geral)

```
LinkedIn / Instagram ──► Post ou notícia no blog ──► CTA ──► Newsletter ou Diagnóstico ──► Comercial
      (vitrine)              (aprofundamento)        (captura)        (relacionamento / lead)
```

O conteúdo mora em arquivos Markdown dentro do repositório. Não existe banco de dados de conteúdo: publicar é adicionar um arquivo `.md` na pasta certa e fazer o deploy.

```
src/content/posts/       → artigos do blog (1 arquivo .md por post)
src/content/noticias/    → notícias publicadas (1 arquivo .md por notícia)
src/data/categorias.ts   → as 5 categorias e suas descrições
src/config/site.ts       → menu, textos do hero, da Metodologia e do Sobre
public/assets/           → logo e imagens locais do protótipo
scripts/radar/           → radar automático de notícias
radar/relatorios/        → relatórios semanais gerados pelo radar (não aparecem no site)
radar/rascunhos/         → rascunhos de notícia em revisão (não aparecem no site)
```

## Papéis

Uma pessoa pode acumular mais de um papel, mas cada papel precisa de um nome.

| Papel | Responsabilidade | Quem |
|---|---|---|
| Dona do blog / editora | Calendário, pautas, padrão de qualidade, métricas | Hannah |
| Autores / SMEs | Escrevem ou são entrevistados sobre o tema | _definir por pauta_ |
| Revisão técnica | Confere se o conteúdo técnico está correto | _definir_ |
| Revisão editorial e SEO | Texto, checklist de publicação, links internos | Marketing |
| Aprovação | Valida antes de publicar (obrigatório nos primeiros 60 dias) | Gerente e CRO |
| Curadoria de notícias | Rotina semanal do radar | _definir_ |
| Manutenção técnica | Deploy, build, dependências, integrações | Dev |

## Fluxo de um post

`Pauta → Briefing → Rascunho → Revisão técnica → Revisão editorial/SEO → Aprovação → Publicação → Distribuição (com UTM) → Leitura de métricas em 30 dias`

Recomendação: controlar esse fluxo em um quadro (Notion ou Jira) com uma coluna por etapa e um cartão por pauta.

## Rotina

| Quando | O quê | Responsável |
|---|---|---|
| Segunda, manhã | Radar roda sozinho e abre um PR com candidatos | Automático |
| Segunda a terça | Curadoria escolhe 3 a 5 notícias, escreve e publica | Curadoria |
| A cada 10–15 dias | Publicação de 1 artigo | Editora |
| Mensal | Revisão de métricas com o Comercial (leads e MQLs por post) | Editora + Comercial |
| Trimestral | Revisão do mapa editorial e das palavras-chave do radar | Marketing |

## Pendências que afetam esta documentação

- Stack e hospedagem finais (a SPA precisa de geração estática para SEO e prévia de links no LinkedIn).
- Se o time de marketing vai publicar por Git ou por um CMS com interface (Decap, Keystatic, TinaCMS).
- Destino real dos formulários (CRM ou Supabase) e política de privacidade.
