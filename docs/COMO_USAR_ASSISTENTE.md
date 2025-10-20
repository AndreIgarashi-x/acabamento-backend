# 🤖 Como Fazer Perguntas ao Assistente IA

## Opção 1: Usando o Frontend (MAIS FÁCIL) ✅

### Passo 1: Acessar a Página do Assistente

1. Faça login no sistema
2. Acesse: `http://localhost:5173/assistente` (local)
   - Ou: `https://seu-frontend.vercel.app/assistente` (produção)

### Passo 2: Fazer Perguntas

1. Digite sua pergunta no campo de texto
2. Clique em "🚀 Perguntar"
3. Aguarde a resposta (2-4 segundos)

### Exemplos de Perguntas:

- "Quem trabalhou na OF 011593?"
- "Quantas peças João produziu hoje?"
- "Qual o status da OF 011593?"
- "Quais OFs estão abertas?"
- "Quem produziu mais esta semana?"

### Recursos da Interface:

- ✅ Campo de entrada de texto
- ✅ Botão para ver exemplos de perguntas
- ✅ Sugestões ao clicar nos exemplos
- ✅ Loading enquanto processa
- ✅ Resposta formatada e amigável

---

## Opção 2: Usando cURL (Para Testes) 🔧

### Passo 1: Obter Token JWT

Faça login e pegue o token:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "matricula": "ANDRE001",
    "pin": "123456"
  }'
```

Copie o `token` da resposta.

### Passo 2: Fazer Pergunta

```bash
curl -X POST http://localhost:3000/api/assistant/query \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Quem trabalhou na OF 011593?"
  }'
```

### Resposta Exemplo:

```json
{
  "success": true,
  "response": "Na OF 011593 trabalharam 3 colaboradores: João Silva (25 peças), Maria Santos (18 peças) e Pedro Costa (9 peças), totalizando 52 peças produzidas em 5 atividades."
}
```

---

## Opção 3: Usando Postman 📮

### Configuração:

1. **Método:** POST
2. **URL:** `http://localhost:3000/api/assistant/query`
3. **Headers:**
   - `Authorization: Bearer SEU_TOKEN`
   - `Content-Type: application/json`
4. **Body (raw JSON):**
   ```json
   {
     "query": "Quem caseou a OF 011593?"
   }
   ```

---

## Opção 4: Integrado em Outro Sistema 💻

### JavaScript/TypeScript

```javascript
const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

async function perguntarAssistente(pergunta) {
  try {
    const response = await fetch(`${API_URL}/assistant/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: pergunta })
    });

    const data = await response.json();

    if (data.success) {
      console.log('Resposta:', data.response);
      return data.response;
    } else {
      console.error('Erro:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    return null;
  }
}

// Uso
perguntarAssistente('Quem trabalhou na OF 011593?')
  .then(resposta => {
    console.log(resposta);
  });
```

### Python

```python
import requests

API_URL = 'http://localhost:3000/api'
token = 'seu_token_jwt'

def perguntar_assistente(pergunta):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    data = {
        'query': pergunta
    }

    response = requests.post(
        f'{API_URL}/assistant/query',
        headers=headers,
        json=data
    )

    result = response.json()

    if result['success']:
        return result['response']
    else:
        return None

# Uso
resposta = perguntar_assistente('Quem trabalhou na OF 011593?')
print(resposta)
```

---

## Endpoints Disponíveis

### 1. POST /api/assistant/query
Enviar pergunta para o assistente.

**Request:**
```json
{
  "query": "Sua pergunta aqui"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Resposta do assistente em linguagem natural"
}
```

### 2. GET /api/assistant/examples
Listar exemplos de perguntas.

**Response:**
```json
{
  "success": true,
  "examples": [
    {
      "categoria": "Consultar OFs",
      "perguntas": [
        "Qual o status da OF 011593?",
        "Quais OFs estão abertas?"
      ]
    }
  ]
}
```

### 3. GET /api/assistant/health
Verificar se o assistente está configurado.

**Response:**
```json
{
  "success": true,
  "status": "online",
  "configured": true
}
```

---

## Tipos de Perguntas Suportadas

### 1. Sobre OFs
- "Qual o status da OF 011593?"
- "Quais OFs estão abertas?"
- "Me fale sobre a ordem 011593"

### 2. Sobre Atividades
- "Quem trabalhou na OF 011593?"
- "Quem caseou a OF 011593?"
- "Quantas atividades tem a OF 011593?"

### 3. Sobre Produção
- "Quantas peças João produziu hoje?"
- "Produção de Maria esta semana"
- "Quanto Pedro caseou no mês?"

### 4. Sobre Desempenho
- "Quem produziu mais hoje?"
- "Ranking de produção da semana"
- "Top 5 colaboradores do mês"

### 5. Sobre Tempo
- "Quanto tempo leva para casear?"
- "Tempo médio de caseamento"
- "Quanto tempo leva para pregar botão?"

---

## Dicas para Melhores Resultados

### ✅ Faça:
- Seja específico: "Quem caseou a OF 011593?"
- Use códigos completos: "OF 011593" (não "OF 593")
- Use nomes completos: "João Silva" (não "João")
- Especifique períodos: "hoje", "esta semana", "no mês"

### ❌ Evite:
- Perguntas muito genéricas: "Me fale sobre tudo"
- Comandos de ação: "Crie uma OF" (o assistente não cria, apenas consulta)
- Perguntas sobre dados inexistentes
- Múltiplas perguntas em uma só: faça uma de cada vez

---

## Troubleshooting

### Erro: "Assistente IA não configurado"
**Causa:** `OPENAI_API_KEY` não está definida.

**Solução:**
1. Obtenha uma chave em: https://platform.openai.com/api-keys
2. Adicione no Railway (variáveis de ambiente)
3. Reinicie o backend

### Erro: "Token inválido"
**Causa:** Token JWT expirado ou inválido.

**Solução:**
1. Faça login novamente
2. Use o novo token nas requisições

### Resposta demora muito
**Causa:** API OpenAI pode estar lenta.

**Solução:**
- Normal: 2-4 segundos
- Se demorar mais de 10s, tente novamente

### Resposta imprecisa
**Causa:** Pergunta muito genérica ou dados não existem.

**Solução:**
- Seja mais específico
- Use códigos de OF e nomes completos
- Verifique se os dados existem no sistema

---

## Checklist de Configuração

Antes de usar o assistente, verifique:

- [ ] Backend está rodando
- [ ] OPENAI_API_KEY configurada no Railway
- [ ] Frontend está rodando
- [ ] Você está logado no sistema
- [ ] Tem uma chave OpenAI válida
- [ ] Há dados no banco (OFs, atividades)

---

## Próximos Passos

1. **Acesse:** `http://localhost:5173/assistente`
2. **Teste:** Faça uma pergunta simples
3. **Explore:** Clique em "Ver exemplos" para mais ideias
4. **Compartilhe:** Mostre para a equipe!

---

## Suporte

Para dúvidas ou problemas:
1. Consulte a documentação completa: `docs/ASSISTENTE_IA.md`
2. Verifique os logs do backend
3. Entre em contato com o time de desenvolvimento
