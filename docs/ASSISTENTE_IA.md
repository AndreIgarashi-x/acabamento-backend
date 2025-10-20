# Assistente IA - Documentação

## Visão Geral

O Assistente IA utiliza a API do OpenAI (GPT-3.5-turbo) para processar perguntas em linguagem natural sobre o sistema de acabamento. Ele consegue interpretar perguntas, consultar o banco de dados e formular respostas amigáveis.

## Configuração

### 1. Obter Chave da API OpenAI

1. Acesse: https://platform.openai.com/api-keys
2. Crie uma nova API Key
3. Copie a chave gerada

### 2. Configurar Variável de Ambiente

Adicione a chave no arquivo `.env`:

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Custo Estimado

- **Modelo**: GPT-3.5-turbo
- **Custo**: ~$0.50 por 1 milhão de tokens
- **Estimativa**: 100-200 perguntas por dia = ~$3-5 por mês

## Endpoints da API

### 1. POST /api/assistant/query

Enviar pergunta para o assistente.

**Headers:**
```
Authorization: Bearer <token_jwt>
Content-Type: application/json
```

**Body:**
```json
{
  "query": "Quem caseou a OF 011593?"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "response": "As peças da OF 011593 foram caseadas por João Silva em 3 atividades, totalizando 52 peças produzidas."
}
```

**Resposta de Erro (500):**
```json
{
  "success": false,
  "message": "Não consegui processar sua pergunta.",
  "error": "Detalhes do erro (apenas em development)"
}
```

### 2. GET /api/assistant/examples

Listar exemplos de perguntas que o assistente consegue responder.

**Headers:**
```
Authorization: Bearer <token_jwt>
```

**Resposta:**
```json
{
  "success": true,
  "examples": [
    {
      "categoria": "Consultar OFs",
      "perguntas": [
        "Qual o status da OF 011593?",
        "Quais OFs estão abertas?",
        "Me fale sobre a ordem 011079"
      ]
    },
    // ... outras categorias
  ]
}
```

### 3. GET /api/assistant/health

Verificar se o assistente está configurado e online.

**Headers:**
```
Authorization: Bearer <token_jwt>
```

**Resposta:**
```json
{
  "success": true,
  "status": "online",
  "message": "Assistente IA está online e pronto para usar",
  "configured": true
}
```

## Tipos de Consulta Suportados

### 1. Atividades por OF
**Perguntas:**
- "Quem trabalhou na OF 011593?"
- "Quem caseou a ordem 011593?"
- "Mostre atividades da OF 011079"

**Retorna:**
- Lista de usuários que trabalharam
- Total de atividades
- Total de peças produzidas
- Detalhes por processo

### 2. Produção de Usuário
**Perguntas:**
- "Quantas peças João produziu hoje?"
- "Produção de Maria esta semana"
- "Quanto João caseou no mês?"

**Retorna:**
- Total de peças produzidas
- Total de atividades
- Tempo total de trabalho
- Lista de atividades por OF

### 3. Status de OF
**Perguntas:**
- "Qual o status da OF 011593?"
- "A ordem 011079 está concluída?"
- "Status da OF 011593"

**Retorna:**
- Status atual (aberta/concluida)
- Total de peças produzidas vs quantidade total
- Progresso percentual

### 4. OFs Abertas
**Perguntas:**
- "Quais OFs estão abertas?"
- "Mostre ordens pendentes"
- "Lista de OFs em aberto"

**Retorna:**
- Lista completa de OFs abertas
- Informações de cada OF (código, referência, quantidade)

### 5. Tempo Médio por Processo
**Perguntas:**
- "Quanto tempo leva para casear?"
- "Tempo médio de caseamento"
- "Quanto tempo leva para pregar botão na OF 011593?"

**Retorna:**
- Tempo médio total por atividade
- Tempo médio por peça
- Total de atividades analisadas

### 6. Ranking de Produção
**Perguntas:**
- "Quem produziu mais hoje?"
- "Ranking de produção da semana"
- "Top 5 colaboradores do mês"

**Retorna:**
- Top 10 usuários mais produtivos
- Total de peças por usuário
- Total de atividades por usuário

### 7. Resumo Completo de OF
**Perguntas:**
- "Me fale sobre a OF 011593"
- "Resumo completo da ordem 011079"
- "Detalhes da OF 011593"

**Retorna:**
- Informações da OF
- Estatísticas gerais
- Resumo por processo
- Últimas 5 atividades

## Exemplos de Uso

### Exemplo 1: Consulta Simples
```bash
curl -X POST http://localhost:3000/api/assistant/query \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "Quem trabalhou na OF 011593?"}'
```

**Resposta:**
```json
{
  "success": true,
  "response": "Na OF 011593 trabalharam 3 colaboradores: João Silva (25 peças), Maria Santos (18 peças) e Pedro Costa (9 peças), totalizando 52 peças produzidas em 5 atividades."
}
```

### Exemplo 2: Ranking de Produção
```bash
curl -X POST http://localhost:3000/api/assistant/query \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "Quem produziu mais hoje?"}'
```

**Resposta:**
```json
{
  "success": true,
  "response": "Hoje, o ranking de produção é:\n1. João Silva - 127 peças (8 atividades)\n2. Maria Santos - 98 peças (6 atividades)\n3. Pedro Costa - 85 peças (5 atividades)\n4. Ana Paula - 72 peças (5 atividades)\n5. Carlos Souza - 64 peças (4 atividades)"
}
```

### Exemplo 3: Status de OF
```bash
curl -X POST http://localhost:3000/api/assistant/query \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "Qual o status da OF 011593?"}'
```

**Resposta:**
```json
{
  "success": true,
  "response": "A OF 011593 está aberta. Foram produzidas 52 de 277 peças (18.8% concluído). Referência: 02674 - JAQUETA."
}
```

## Arquitetura do Sistema

### Fluxo de Processamento

1. **Análise da Pergunta (GPT)**
   - Usuário envia pergunta em linguagem natural
   - GPT interpreta e extrai:
     - Tipo de consulta
     - Parâmetros necessários (códigos, nomes, datas)
     - Se precisa buscar dados no banco

2. **Execução de Consulta (Backend)**
   - Backend recebe análise do GPT
   - Executa query SQL segura e parametrizada
   - NUNCA executa SQL gerado pelo GPT
   - Retorna dados estruturados

3. **Formulação de Resposta (GPT)**
   - GPT recebe dados brutos do banco
   - Transforma em resposta natural e amigável
   - Formata números e datas
   - Retorna resposta final ao usuário

### Segurança

#### ✅ Implementado
- Autenticação JWT obrigatória
- Queries SQL parametrizadas (prevenção SQL Injection)
- GPT não tem acesso direto ao banco de dados
- Rate limiting para prevenir abuso
- Validação de entrada com express-validator

#### 🔒 Boas Práticas
- GPT apenas interpreta e formula respostas
- Backend controla 100% das queries
- Logs completos de todas as perguntas
- Timeout de 30s para requisições OpenAI

## Limitações e Considerações

### Perguntas que o Assistente NÃO consegue responder:
- Perguntas sobre dados que não existem no sistema
- Comandos de ação (criar, editar, deletar)
- Perguntas muito genéricas sem contexto
- Perguntas sobre futuro ou previsões

### Performance
- Tempo médio de resposta: 2-4 segundos
- Depende da velocidade da API OpenAI
- Cache não implementado (considerar para futuro)

### Custos
- GPT-3.5-turbo é muito econômico
- ~100-200 perguntas/dia = $3-5/mês
- Considerar GPT-4 apenas se precisar mais precisão

## Troubleshooting

### Erro: "Assistente IA não configurado"
**Causa:** `OPENAI_API_KEY` não está definida no `.env`

**Solução:**
1. Adicione a chave no arquivo `.env`
2. Reinicie o servidor

### Erro: "Não consegui processar sua pergunta"
**Causa:** Erro na API OpenAI ou pergunta muito complexa

**Solução:**
1. Verifique os logs do backend
2. Reformule a pergunta de forma mais simples
3. Verifique se a chave OpenAI está válida

### Resposta imprecisa ou incorreta
**Causa:** GPT interpretou mal a pergunta

**Solução:**
1. Seja mais específico (inclua códigos de OF, nomes completos)
2. Use exemplos similares aos mostrados na documentação
3. Ajuste o `systemPrompt` em `gptAssistant.js` se necessário

## Melhorias Futuras

### Curto Prazo
- [ ] Cache de respostas para perguntas repetidas
- [ ] Histórico de conversas
- [ ] Sugestões de perguntas relacionadas

### Médio Prazo
- [ ] Suporte a múltiplos idiomas
- [ ] Exportar respostas em PDF/Excel
- [ ] Gráficos gerados automaticamente

### Longo Prazo
- [ ] Assistente proativo (alertas automáticos)
- [ ] Integração com WhatsApp/Telegram
- [ ] Voice assistant (speech-to-text)

## Suporte

Para dúvidas ou problemas com o Assistente IA:
1. Verifique os logs do backend
2. Consulte esta documentação
3. Entre em contato com o time de desenvolvimento
