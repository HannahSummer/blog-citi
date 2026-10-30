# 03 — Radar automático de notícias

## O que ele faz (e o que não faz)

O radar **automatiza a busca, a triagem e o rascunho**. A aprovação continua humana.

```
Feeds RSS ──► coleta ──► filtro (janela de 7 dias, termos bloqueados)
         ──► pontuação por palavras-chave e peso da fonte ──► remoção de duplicadas
         ──► Claude escreve título, resumo e "por que importa" dos 12 melhores
             e descarta os que não servem ao ICP (até 6 seguem)
         ──► API do blog (POST /api/radar/noticias) grava como "pendente"
         ──► marketing revisa e aprova no painel /blog/admin/noticias
```

Ele **não** publica nada sozinho e **não** copia o texto das matérias: o Claude recebe só título e o trecho curto do feed, e a instrução é escrever com palavras próprias, sem inventar dados. Roda no GitHub Actions toda segunda, ou no seu computador.

### Por que RSS e não scraping

Raspar o HTML dos portais quebra toda vez que o site muda o layout, muitas vezes viola os termos de uso e pode ser bloqueado. RSS é o canal que os próprios veículos oferecem para distribuir as manchetes, é estável e traz título, link, data e um resumo curto, que é exatamente o que a triagem precisa. Para veículos sem RSS, o radar usa a busca do Google Notícias em formato RSS (confira os termos de uso antes de colocar em produção).

## Configuração (uma vez)

Depois que a API estiver no ar (docs/12-BACKEND-E-DEPLOY.md):

1. Cadastre as pessoas editoras (docs/02-NOTICIAS.md → Quem pode aprovar).
2. No GitHub, em **Settings → Secrets and variables → Actions**, crie:

| Secret | Onde pegar |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys (conta do CITi) |
| `API_URL` | Endereço público da API no Coolify, sem `/api` no fim (ex.: `https://api.blog.citi.org.br`) |
| `RADAR_TOKEN` | O mesmo valor da variável `RADAR_TOKEN` do serviço da API no Coolify |

O `RADAR_TOKEN` só permite enviar sugestões, que entram como pendentes. Mesmo assim, ele só pode existir nos Secrets do GitHub, no Coolify e no terminal de quem roda o radar; **nunca** no `.env` do site nem com prefixo `VITE_`. Se vazar, gere outro e troque nos dois lugares.

**Custo:** até 12 chamadas ao Claude por semana, cada uma com algumas centenas de palavras. Fica na casa de centavos de dólar por semana.

## Fontes mapeadas

Todas testadas em 28/10/2026 com `npm run radar -- --checar-fontes`. Peso 2 = muito alinhada ao ICP.

| Tema | Fontes | Peso |
|---|---|---|
| Ecossistema Recife e Porto Digital | Movimento Econômico, Porto Digital, Google Notícias ("Porto Digital"; tecnologia em Recife/PE) | 2 |
| Pesquisas e fontes primárias | Agência Sebrae, Google Notícias (Cetic.br, TIC Empresas, IBGE) | 2 |
| | Agência Brasil — Economia | 1 |
| Soluções e Inovação (software, IA, dados, MVP, legado) | TI Inside, Baguete, MIT Technology Review Brasil, Mobile Time, Startupi, Startups.com.br, Canaltech, Google Notícias (IA nas empresas; transformação digital em PMEs; sistemas legados) | 1 |
| Gestão e Financeiro | MIT Sloan Review Brasil | 2 |
| | Exame, NeoFeed, InfoMoney, Contábeis (fiscal e tributário) | 1 |
| Negócios: Marketing e comercial | Meio & Mensagem, Propmark, Consumidor Moderno | 1 |

Desativadas por bloquearem o radar (erro 403): Diario de Pernambuco e IT Forum. Sem RSS acessível: Cetic.br, IBGE, Computerworld, CIO, HBR Brasil, Mundo do Marketing, E-Commerce Brasil, StartSe (por isso as buscas do Google Notícias).

Para checar de novo:

```bash
npm run radar -- --checar-fontes
```

Fonte com `ERRO` por algumas semanas seguidas: procure outro RSS do veículo (`/feed/`, `/rss`, `/rss.xml`) ou troque por uma busca do Google Notícias.

## Rodar no computador

```bash
# Sem chaves: só o relatório de candidatos em radar/relatorios/
npm run radar

# Fluxo completo (copy + envio ao painel)
export ANTHROPIC_API_KEY=...            # PowerShell: $env:ANTHROPIC_API_KEY="..."
export API_URL=http://localhost:3000   # ou o endereço da API em produção
export RADAR_TOKEN=...                  # local: o valor que está no docker-compose.yml
npm run radar:semanal
# → radar/sugestoes/semana-AAAA-MM-DD.md (prévia da copy) e sugestões no painel
```

Sem `API_URL` e `RADAR_TOKEN`, o `radar:semanal` escreve a copy só na prévia local. Rodar duas vezes na mesma semana não duplica: links repetidos são ignorados.

O fluxo antigo continua disponível para escrever à mão: `npm run radar:promover -- <id>` cria um rascunho Markdown em `radar/rascunhos/`.

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

O workflow `.github/workflows/radar-semanal.yml` roda toda segunda às 8h (Brasília). Também dá para rodar manualmente em **Actions → Radar semanal de notícias → Run workflow**. O relatório e a prévia ficam anexados à execução por 30 dias (seção *Artifacts*).

## Ajustando a copy

O texto de instrução do Claude fica em `scripts/radar/redigir.ts` (constante `SISTEMA`). Quantidade e modelo ficam em `config.ts`: `MAX_PARA_REDACAO`, `MAX_SUGESTOES_SEMANA` e `MODELO_REDACAO`. Se marketing editar sempre o mesmo tipo de coisa (tom, tamanho, um termo), ajuste a instrução em vez de corrigir à mão toda semana.

## Evoluções possíveis (depois de validar a rotina)

- **Aviso no Slack ou e-mail** quando as sugestões da semana chegarem ao painel.
- **Ler a matéria inteira** antes de escrever (ferramenta de busca do Claude), para resumos mais ricos que o trecho do feed.
- **Histórico:** usar a tabela `noticias` para ver quais temas aparecem mais e alimentar a pauta de artigos.

## Limitações conhecidas

- Resumo de RSS às vezes vem vazio ou cortado; a pontuação então depende só do título.
- Links do Google Notícias são redirecionamentos; abra e copie o endereço final da matéria.
- Palavras-chave curtas geram falso positivo (por isso `' ia '` tem espaços em volta).
