---
title: "LGPD em projetos digitais: o que decidir antes de começar"
excerpt: "O sistema ficou pronto e só então alguém perguntou sobre a LGPD. Veja as decisões que evitam refazer o projeto depois."
meta_description: "Saiba o que decidir sobre LGPD em projetos digitais antes do desenvolvimento: dados necessários, base legal, acesso, prazo de guarda e direitos do titular."
date: "2026-11-23"
categoria: "solucoes"
subtema: "dados"
etapa_funil: "consideracao"
cta_tipo: "diagnostico"
cta_link: ""
cover: "/images/covers/lgpd-em-projetos-digitais.webp"
cover_alt: "Ilustração abstrata de uma grade de pontos ao redor de um círculo escuro, em azul e verde"
author: "Equipe CITi"
featured: true
draft: false
palavras_chave: "LGPD em projetos digitais, proteção de dados, privacidade desde a concepção, adequação à LGPD"
---

É comum a LGPD em projetos digitais entrar na conversa só no fim. O sistema está pronto, os formulários coletam dezenas de informações e, na véspera do lançamento, alguém pergunta: "e a LGPD?". Nesse momento, adequar o projeto custa caro, porque exige mudar telas, bancos de dados e fluxos que já foram construídos.

A [Lei Geral de Proteção de Dados (Lei 13.709/2018)](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) vale para qualquer empresa que trata dados pessoais, de clientes, funcionários ou parceiros. Por isso, tratar a LGPD em projetos digitais desde o início é mais simples e mais barato do que corrigir depois. Este artigo não substitui uma orientação jurídica, mas mostra as decisões de produto que precisam ser tomadas antes de começar.

## Por que a LGPD em projetos digitais começa no planejamento

Cada dado pessoal que um sistema coleta gera responsabilidades: guardar com segurança, usar só para a finalidade informada, apagar quando não for mais necessário e atender aos pedidos do titular. Ou seja, quanto mais dados o projeto coleta, maior o trabalho para cumprir a lei.

Assim, a forma mais eficiente de reduzir esse trabalho é decidir, ainda no planejamento, o que o sistema realmente precisa. Essa ideia costuma ser chamada de **privacidade desde a concepção**: em vez de proteger tudo o que foi coletado, o projeto coleta apenas o necessário.

## Decisões de LGPD em projetos digitais antes do código

Antes do primeiro sprint, vale responder por escrito a cinco perguntas:

1. **Quais dados pessoais o sistema precisa, e para quê?** Liste cada campo e a finalidade. Se não houver uma finalidade clara, o campo sai do formulário.
2. **Qual é a base legal para cada uso?** A lei prevê hipóteses como consentimento, execução de contrato e cumprimento de obrigação legal. Por exemplo, o e-mail usado para entregar um serviço contratado tem uma base diferente do e-mail usado para enviar uma newsletter.
3. **Quem vai ter acesso?** Defina perfis de acesso desde o início. Nem todo usuário interno precisa ver todos os dados de todos os clientes.
4. **Por quanto tempo os dados ficam guardados?** Estabeleça um prazo e o que acontece depois: exclusão ou anonimização.
5. **Como o titular exerce seus direitos?** A lei garante, entre outros, o direito de acessar, corrigir e pedir a exclusão dos próprios dados. O sistema precisa permitir que isso seja feito sem gambiarra.

Na prática, essas respostas cabem em uma página e orientam o time de desenvolvimento, o jurídico e quem vai operar o sistema depois.

## O que muda no desenvolvimento com a LGPD

Com as decisões tomadas, a LGPD em projetos digitais aparece no produto de formas concretas:

- **Formulários menores**, só com os campos que têm finalidade definida.
- **Consentimento claro e separado** quando ele é a base legal, como a caixa para receber a newsletter, que não pode vir marcada.
- **Registro de quando e como o consentimento foi dado**, incluindo a versão do texto aceito.
- **Perfis de acesso** configurados no sistema, e não só combinados entre as pessoas.
- **Uma forma de excluir os dados de um titular** a pedido, sem precisar de alguém mexendo direto no banco de dados.

Além disso, fornecedores que tratam dados em nome da empresa, como hospedagem e ferramentas de e-mail, também entram na análise. Afinal, a responsabilidade pelos dados não desaparece quando eles saem do sistema principal.

## Erros comuns que geram retrabalho

Alguns deslizes aparecem com frequência e só são percebidos quando o sistema já está no ar:

- **Coletar dados "para o caso de precisar".** Cada campo sem finalidade aumenta o risco, mas não traz benefício. Por isso, na dúvida, o campo fica de fora.
- **Usar um único consentimento para tudo.** Aceitar os termos de uso não significa aceitar receber ofertas. Cada finalidade baseada em consentimento precisa ter o próprio aceite.
- **Esquecer os dados de teste.** Cópias do banco de produção usadas em testes também contêm dados pessoais. Portanto, o ideal é usar dados fictícios nos ambientes de teste.
- **Não ter dono.** Sem uma pessoa responsável por responder aos pedidos dos titulares, eles ficam sem resposta. A lei prevê a figura do encarregado justamente para esse papel.

## Onde buscar orientação

A [Autoridade Nacional de Proteção de Dados (ANPD)](https://www.gov.br/anpd/pt-br) publica guias e orientações, inclusive voltados a agentes de pequeno porte. Para decisões jurídicas específicas, como a escolha da base legal em casos menos óbvios, o caminho é consultar um profissional da área.

Do lado do produto, o mapeamento de dados conversa diretamente com a [organização dos dados da empresa](/blog/artigos/como-organizar-os-dados-da-empresa) e com o [Discovery](/blog/artigos/discovery-de-produto): entender o problema antes de construir inclui entender quais informações são, de fato, necessárias.

## O próximo passo

No próximo projeto digital, inclua as cinco perguntas na fase de planejamento, antes de qualquer tela ser desenhada. Elas reduzem o volume de dados coletados, evitam retrabalho e deixam a empresa mais preparada para responder a clientes e à fiscalização.

Se quiser ajuda para mapear os dados de um projeto antes de começar, o [diagnóstico do CITi](/blog/diagnostico) é um bom ponto de partida.
