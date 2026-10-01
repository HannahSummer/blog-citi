# 02 — Notícias: estrutura, regras e rotina semanal

## Para que serve a seção

O "Radar da semana" é curadoria, não agregação. O valor está no **olhar do CITi**: por que aquela notícia importa para uma empresa que depende de tecnologia. Sem isso, a seção vira uma cópia pior do que qualquer portal já oferece.

## Onde ficam

| Pasta | O que é | Aparece no site? |
|---|---|---|
| `radar/relatorios/` | Relatórios semanais com candidatos (gerados pelo radar) | Não |
| `radar/rascunhos/` | Notícias escolhidas, em redação | Não |
| `src/content/noticias/` | Notícias prontas | **Sim** |

Uma notícia só vai ao ar quando o arquivo é movido para `src/content/noticias/`.

## Modelo do arquivo

```markdown
---
title: "Metade das empresas brasileiras já usa IA, mas poucas medem o retorno"
date: "2026-09-29"
categoria: "inovacao"
fonte: "Canaltech"
link: "https://endereco-da-materia-original"
resumo: "Pesquisa divulgada no AWS Summit indica que a adoção de IA chegou a metade das empresas, mas só uma pequena parte usa a tecnologia em nível avançado."
---

Por que isso importa: o dado mostra que o gargalo deixou de ser acesso à ferramenta e passou a ser saber
qual problema ela deve resolver. Antes de contratar mais uma solução de IA, vale perguntar qual métrica
de negócio ela precisa mover e como isso será medido.
```

- `resumo`: 2 a 3 frases **com suas palavras**.
- Corpo do arquivo: o bloco "Por que isso importa", com 1 parágrafo curto.
- `categoria`: as mesmas 5 do blog.
- `link`: sempre o endereço final da matéria (se veio do Google Notícias, abra e copie o link real).

## Regras editoriais e de direito autoral

1. **Nunca copie texto da matéria**, nem parágrafos, nem frases longas. Resuma com suas palavras e aponte para a fonte.
2. **Nunca copie imagens** de terceiros. Notícias não têm capa.
3. **Sempre dê crédito**: nome do veículo no campo `fonte` e link para a matéria original.
4. **Prefira fontes primárias** quando existirem (pesquisa do Cetic.br, release do Sebrae) em vez de reportagens que repercutem a pesquisa.
5. **Fuja de**: política partidária, fofoca, notícia de tecnologia de consumo sem impacto em empresa, press release disfarçado de notícia.
6. **Critério de escolha**: a notícia precisa revelar um problema, uma mudança ou uma oportunidade para empresas do nosso ICP. Se não der para escrever o "por que importa" em 3 frases, não é para o radar.

## Rotina semanal (30 a 45 minutos)

| Passo | Tempo | Como |
|---|---|---|
| 1. Abrir o PR "Radar da semana" | automático | Aba Pull Requests do GitHub (toda segunda de manhã) |
| 2. Triagem | 10 min | Ler os títulos, abrir os 8 a 10 mais promissores |
| 3. Escolha | 5 min | Ficar com 3 a 5, variando categoria |
| 4. Gerar rascunhos | 1 min | `npm run radar:promover -- <id> <id> ...` |
| 5. Redação | 15–25 min | Preencher `resumo` e "por que importa" em cada rascunho |
| 6. Publicar | 5 min | Mover os arquivos para `src/content/noticias/`, commit e PR |
| 7. Fechar o PR do radar | 1 min | Pode fazer merge (guarda o histórico) ou fechar |

Se numa semana não houver nada bom, publique menos. **Três notícias boas valem mais que cinco medianas.** O radar desatualizado passa impressão pior do que uma semana com menos itens, então se for pular a semana, avise o time.

## Métricas da seção

- Cliques em "Ler na fonte" (mostra interesse).
- Cliques de notícia para artigo ou newsletter (mostra se a seção alimenta o funil).
- Inscrições na newsletter vindas de `/blog/noticias`.

Se depois de 2 meses a seção não gerar cliques para artigos ou newsletter, revise o formato antes de continuar investindo tempo.
