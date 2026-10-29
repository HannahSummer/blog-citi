# Contexto do MVP

## Conteúdo

O MVP tem cinco posts editoriais planejados, um por tema, conforme `11-DECISOES-E-ARTIGOS.md`:

1. Negócios
2. Soluções
3. Gestão
4. Soluções / Inovação
5. Gestão / Financeiro

As categorias do blog são `negocios`, `solucoes` e `gestao`. Os subtemas são `marketing-comercial` (Negócios), `inovacao` (Soluções) e `financeiro` (Gestão). Categorias sem posts publicados não aparecem nos filtros.

## Diagnóstico

A rota `/blog/diagnostico` tem o quiz de 6 perguntas (4 níveis, 0 a 12 pontos) e, depois do resultado, o formulário de contato. Perguntas, níveis, textos e opções ficam só em `src/config/diagnostico.ts`; as regras do formulário, em `src/lib/diagnostico-schema.ts`; o envio, em `src/services/leads.ts`. A chave `diagnosticoComBanco` em `src/config/site.ts` liga sozinha quando o `.env` tem as variáveis do Supabase. Sem elas, `npm run dev` usa o modo demonstração e o build publicado mostra o botão `Falar com o CITi`. Detalhes em `docs/05-DIAGNOSTICO-E-LEADS.md`.

## Sobre e momentos

| Rota | Função |
|---|---|
| `/blog/sobre` | Listagem de momentos com filtro por tipo |
| `/blog/sobre/:slug` | Momento individual, galeria e relacionados |
| `/blog/sobre/quem-somos` | Quem somos, método, projetos e CTA |
| `/blog/destaques/*` | Redirect legado para `/blog/sobre` |

Momentos ficam em `src/content/momentos/` e usam `title`, `date`, `tipo`, `resumo`, `capa` e `capa_alt`. Os tipos são `premiacao`, `evento`, `projeto` e `equipe`. Apenas um momento deve ter `destaque: true`; se houver mais de um, o mais recente é usado e um aviso é registrado. Se não houver destaque publicado, a Home mostra o título da seção e o CTA para `/blog/sobre`.

## Roteiro de teste do MVP

- Completar o quiz com pontuação 0, 5, 8 e 12 e conferir cada nível.
- Conferir o botão `Falar com o CITi` e origem/UTMs no link.
- Abrir uma página de destaque compartilhável quando houver data confirmada.
- Abrir `/blog/artigos?categoria=solucoes` e conferir subtemas publicados e contagem.
- Conferir Home em 390px, 768px e 1440px.
- Rodar `npm run typecheck` e `npm run build`.
- Conferir `/blog/sobre`, filtros por tipo e estado vazio.
- Conferir `/blog/sobre/:slug`, galeria opcional, relacionados e CTA.
- Conferir redirect de `/blog/destaques/...` para `/blog/sobre`.
- Conferir foco visível em menu, filtros, cards e links da galeria.
