# 02 — Notícias: estrutura, regras e rotina semanal

## Para que serve a seção

O "Radar da semana" é curadoria, não agregação. O valor está no **olhar do CITi**: por que aquela notícia importa para uma empresa que depende de tecnologia. Sem isso, a seção vira uma cópia pior do que qualquer portal já oferece.

## Onde ficam

| Lugar | O que é | Aparece no site? |
|---|---|---|
| Painel `/blog/admin/noticias` → **Para revisar** | Sugestões da semana, com a copy escrita pelo Claude | Não |
| Painel → **Publicadas** | Notícias aprovadas (tabela `noticias` no Supabase) | **Sim**, na hora |
| Painel → **Rejeitadas** | Sugestões descartadas | Não |
| `src/content/noticias/` | Notícias escritas à mão em Markdown (formato antigo, continua valendo) | **Sim** |

O site mostra as duas origens juntas, da mais recente para a mais antiga.

## Modelo do arquivo

```markdown
---
title: "Metade das empresas brasileiras já usa IA, mas poucas medem o retorno"
date: "2026-09-29"
categoria: "inovacao"
fonte: "Canaltech"
link: "https://endereco-da-materia-original"
resumo: "Pesquisa divulgada no AWS Summit indica que a adoção de IA chegou a metade das empresas, mas só uma pequena parte usa a tecnologia em nível avançado."
continente: "america-do-sul"
local: "São Paulo, Brasil"
lat: -23.55
lng: -46.63
---

Por que isso importa: o dado mostra que o gargalo deixou de ser acesso à ferramenta e passou a ser saber
qual problema ela deve resolver. Antes de contratar mais uma solução de IA, vale perguntar qual métrica
de negócio ela precisa mover e como isso será medido.
```

- `resumo`: 2 a 3 frases **com suas palavras**.
- Corpo do arquivo: o bloco "Por que isso importa", com 1 parágrafo curto.
- `categoria`: as mesmas 5 do blog.
- `link`: sempre o endereço final da matéria (se veio do Google Notícias, abra e copie o link real).
- `continente` (opcional): coloca a notícia no globo do topo da página. Valores: `america-do-sul`,
  `america-do-norte`, `europa`, `africa`, `asia`, `oceania`. Sem ele, a notícia aparece só na lista.
- `local`, `lat` e `lng` (opcionais): cidade mostrada no card do globo e posição exata do pino. Sem
  coordenadas, o pino fica perto do centro do continente. No painel, o continente é escolhido no campo
  "Continente" (o radar já sugere um).

## Regras editoriais e de direito autoral

1. **Nunca copie texto da matéria**, nem parágrafos, nem frases longas. Resuma com suas palavras e aponte para a fonte.
2. **Nunca copie imagens** de terceiros. Notícias não têm capa.
3. **Sempre dê crédito**: nome do veículo no campo `fonte` e link para a matéria original.
4. **Prefira fontes primárias** quando existirem (pesquisa do Cetic.br, release do Sebrae) em vez de reportagens que repercutem a pesquisa.
5. **Fuja de**: política partidária, fofoca, notícia de tecnologia de consumo sem impacto em empresa, press release disfarçado de notícia.
6. **Critério de escolha**: a notícia precisa revelar um problema, uma mudança ou uma oportunidade para empresas do nosso ICP. Se não der para escrever o "por que importa" em 3 frases, não é para o radar.

## Rotina semanal (10 a 20 minutos)

Toda segunda às 8h a automação coleta as notícias da semana, escolhe até 6 e entrega a copy pronta no painel. A pessoa de marketing só revisa e aprova.

| Passo | Como |
|---|---|
| 1. Entrar no painel | `/blog/admin/noticias` (o link não aparece no menu), com a conta de editor |
| 2. Ler cada card | À esquerda, os campos editáveis; à direita, **como fica no site**, atualizando enquanto você edita |
| 3. Conferir a fonte | **Abrir matéria** e **Ver título e trecho originais**: confirme que o resumo é fiel e não repete frases da fonte |
| 4. Ajustar | Título, resumo, "por que importa", categoria, subtema e link |
| 5. Link do Google Notícias | Se aparecer o aviso amarelo, abra a matéria e cole o endereço final |
| 6. Decidir | **Aprovar e publicar** (vai ao ar na hora) ou **Rejeitar** |

Uma notícia publicada pode ser corrigida na aba **Publicadas** ou tirada do ar com **Tirar do ar**, que a devolve para revisão.

Se numa semana não houver nada bom, rejeite tudo. **Três notícias boas valem mais que cinco medianas.**

### Quem pode aprovar

Só contas cadastradas como editoras. Para incluir alguém (uma vez, por quem administra o Supabase):

1. **Authentication → Users → Add user**: e-mail e senha da pessoa, marcando *Auto Confirm User*.
2. **SQL Editor**:
   ```sql
   insert into public.editores (user_id, email)
   select id, email from auth.users where email = 'pessoa@citi.org.br';
   ```

Para remover o acesso: `delete from public.editores where email = 'pessoa@citi.org.br';`.

## Métricas da seção

- Cliques em "Ler na fonte" (mostra interesse).
- Cliques de notícia para artigo ou newsletter (mostra se a seção alimenta o funil).
- Inscrições na newsletter vindas de `/blog/noticias`.

Se depois de 2 meses a seção não gerar cliques para artigos ou newsletter, revise o formato antes de continuar investindo tempo.
