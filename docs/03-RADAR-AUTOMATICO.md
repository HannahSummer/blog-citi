# 03 — Radar automático de notícias

## O que ele faz (e o que não faz)

O radar **automatiza a busca e a triagem**. A escolha e a redação continuam humanas.

```
Feeds RSS ──► coleta ──► filtro (janela de 7 dias, termos bloqueados)
         ──► pontuação por palavras-chave e peso da fonte
         ──► remoção de duplicadas ──► relatório .md com os 25 melhores
         ──► PR automático no GitHub toda segunda
```

Ele **não** publica nada, **não** copia o texto das matérias e **não** roda no site. Roda no seu computador ou no GitHub Actions, uma vez por semana.

### Por que RSS e não scraping

Raspar o HTML dos portais quebra toda vez que o site muda o layout, muitas vezes viola os termos de uso e pode ser bloqueado. RSS é o canal que os próprios veículos oferecem para distribuir as manchetes, é estável e traz título, link, data e um resumo curto, que é exatamente o que a triagem precisa. Para veículos sem RSS, o radar usa a busca do Google Notícias em formato RSS (confira os termos de uso antes de colocar em produção).

## Instalação (uma vez)

1. Copie `scripts/radar/`, `radar/` e `.github/workflows/radar-semanal.yml` para a raiz do repositório.
2. Instale as dependências:
   ```bash
   npm i rss-parser
   npm i -D tsx @types/node
   ```
   (O projeto já tem TypeScript e `"type": "module"`, que o radar usa.)
3. Adicione ao `package.json`:
   ```json
   "scripts": {
     "radar": "tsx scripts/radar/index.ts",
     "radar:promover": "tsx scripts/radar/promover.ts",
     "radar:tipos": "tsc -p scripts/radar/tsconfig.json"
   }
   ```
4. Se o `tsconfig.json` da raiz tiver `include`, garanta que ele **não** inclua `scripts/`: o radar tem o próprio `tsconfig`, com tipos de Node, e não deve entrar no build do Vite.
5. Com Docker, rode os comandos dentro do container: `docker compose exec blog-citi npm run radar`. Depois de instalar pacotes, rode `docker compose up --build`.

## Primeiro uso: validar as fontes

As URLs de feed em `config.ts` foram inferidas e estão com `verificada: false`. Antes de tudo:

```bash
npm run radar -- --checar-fontes
```

Para cada fonte com `OK`, marque `verificada: true`. Para as com `ERRO`, procure o RSS no site do veículo (geralmente um ícone laranja, ou `/feed/`, `/rss`, `/rss.xml` no fim do endereço). Se não existir, desative (`ativa: false`) ou troque por uma busca do Google Notícias.

## Uso semanal

```bash
npm run radar
# → radar/relatorios/radar-AAAA-MM-DD.md  (leitura)
# → radar/relatorios/radar-AAAA-MM-DD.json (usado pelo promover)

npm run radar:promover -- porto-digital-cresce-19 metade-das-empresas-usa-ia
# → radar/rascunhos/<id>.md, com front matter preenchido e campos TODO
```

O `id` de cada candidato aparece no relatório. Depois de escrever, mova o arquivo para `src/content/noticias/`.

## Ajustando o que o radar procura

Tudo fica em `scripts/radar/config.ts`:

| Constante | Para que serve |
|---|---|
| `FONTES` | Lista de feeds, com `peso` 1 (comum) ou 2 (muito alinhada ao ICP) |
| `PALAVRAS_POR_CATEGORIA` | Palavras que pontuam cada categoria: 2 pontos no título, 1 no resumo. Sem acento e em minúsculas |
| `TERMOS_BLOQUEADOS` | Se aparecerem no título, o item é descartado |
| `JANELA_DIAS` | Quantos dias para trás buscar (padrão: 7) |
| `MAX_CANDIDATOS` / `PONTUACAO_MINIMA` | Tamanho e rigor do relatório |

Pontuação final = soma dos pontos de palavras × peso da fonte + bônus se tiver menos de 48h. A categoria sugerida é a que mais pontuou (confira sempre, é só uma sugestão).

**Dica de calibragem:** nas primeiras 3 semanas, anote quais candidatos você escolheu e quais descartou. Palavras que aparecem muito nos descartados viram `TERMOS_BLOQUEADOS`; temas que você procurou e não vieram viram palavras novas ou uma busca nova do Google Notícias.

## Agendamento no GitHub Actions

O workflow `.github/workflows/radar-semanal.yml` roda toda segunda às 8h (Brasília) e abre um PR com o relatório. Também dá para rodar manualmente na aba **Actions → Radar semanal de notícias → Run workflow**.

Configuração necessária no repositório (uma vez, por quem administra):
**Settings → Actions → General → Workflow permissions**: marcar "Read and write permissions" e "Allow GitHub Actions to create and approve pull requests".

## Evoluções possíveis (depois de validar a rotina)

- **Rascunho com IA:** um passo opcional que chama a API do Claude para sugerir categoria, resumo e um primeiro "por que importa" para cada item promovido. A chave vai em *GitHub Secrets*, nunca no código ou no frontend, e o texto gerado continua passando por revisão humana antes de publicar.
- **Aviso no Slack:** postar o link do PR no canal do marketing quando o radar rodar.
- **Histórico:** usar os relatórios antigos para ver quais temas aparecem mais ao longo do tempo e alimentar a pauta de artigos.

## Limitações conhecidas

- Resumo de RSS às vezes vem vazio ou cortado; a pontuação então depende só do título.
- Links do Google Notícias são redirecionamentos; abra e copie o endereço final da matéria.
- Palavras-chave curtas geram falso positivo (por isso `' ia '` tem espaços em volta).
