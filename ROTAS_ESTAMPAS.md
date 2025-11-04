# 🎨 Rotas API - Módulo Estampas

Documentação das novas rotas criadas para o módulo de Estampas (Bordado, DTF, Patch).

---

## 📋 Índice

1. [Máquinas](#máquinas) - `/api/machines`
2. [Bordado](#bordado) - `/api/bordado`
3. [Relatórios](#relatórios) - `/api/estampas-reports`

---

## 🤖 Máquinas

### `GET /api/machines`
Listar todas as máquinas

**Query Params:**
- `modulo_id` (opcional): Filtrar por módulo
- `tipo` (opcional): `bordado`, `dtf`, `prensa`
- `status` (opcional): `ativa`, `inativa`, `manutencao`

**Resposta:**
```json
{
  "success": true,
  "data": [...],
  "count": 4
}
```

---

### `GET /api/machines/:id`
Obter máquina por ID (com cabeças)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "codigo": "BORDADEIRA-01",
    "nome": "Bordadeira Tajima 15 Cabeças - Máquina 1",
    "tipo": "bordado",
    "num_cabecas": 15,
    "status": "ativa",
    "machine_heads": [...]
  }
}
```

---

### `POST /api/machines`
Criar nova máquina

**Body:**
```json
{
  "codigo": "BORDADEIRA-03",
  "nome": "Bordadeira Nova",
  "tipo": "bordado",
  "modulo_id": 2,
  "num_cabecas": 15
}
```

---

### `PUT /api/machines/:id`
Atualizar máquina

**Body:**
```json
{
  "nome": "Novo Nome",
  "status": "manutencao",
  "ultima_manutencao": "2025-11-03T10:00:00Z"
}
```

---

### `DELETE /api/machines/:id`
Deletar máquina (se não tiver atividades)

---

### `GET /api/machines/:id/heads`
Listar cabeças de uma máquina

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "machine_id": 1,
      "numero_cabeca": 1,
      "status": "ok",
      "total_problemas": 0
    }
  ]
}
```

---

### `PUT /api/machines/:id/heads/:head_id`
Atualizar status de uma cabeça

**Body:**
```json
{
  "status": "problema",
  "ultimo_problema": "quebra_linha"
}
```

---

## 🧵 Bordado

### `POST /api/bordado/start`
Iniciar atividade de bordado

**Body:**
```json
{
  "user_id": "uuid-do-usuario",
  "process_id": "uuid-do-processo-bordado",
  "of_id": "uuid-da-of",
  "machine_id": 1,
  "cabecas_utilizadas": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  "qty_planejada": 100
}
```

**Validações:**
- Verifica se usuário está ativo
- Verifica se máquina está disponível
- Verifica se cabeças selecionadas estão OK (sem problemas)
- Verifica se usuário não tem outra sessão ativa
- Calcula eficiência automaticamente

**Resposta:**
```json
{
  "success": true,
  "message": "Bordado iniciado com sucesso",
  "data": {
    "id": "uuid-activity",
    "machine_id": 1,
    "cabecas_utilizadas": [1,2,3,4,5,6,7,8,9,10],
    "percentual_eficiencia": 67,
    "status": "ativa"
  }
}
```

---

### `POST /api/bordado/:activity_id/problema`
Registrar problema durante bordado

**Body:**
```json
{
  "machine_head_id": 5,
  "tipo_problema": "quebra_linha",
  "descricao": "Linha da cabeça 5 quebrou durante operação"
}
```

**Ações:**
- Registra problema na tabela `machine_problems`
- Atualiza status da cabeça para "problema"
- Adiciona pausa detalhada na atividade
- Incrementa contador de pausas

---

### `PUT /api/bordado/problema/:problem_id/resolver`
Resolver problema

**Body:**
```json
{
  "resolvido_por": "uuid-do-usuario"
}
```

**Ações:**
- Calcula tempo de parada
- Atualiza cabeça para status "ok"
- Acumula tempo de pausa na atividade
- Marca problema como resolvido

---

### `PUT /api/bordado/:activity_id/cabecas`
Atualizar cabeças em uso (durante operação)

**Body:**
```json
{
  "cabecas_utilizadas": [1, 2, 3, 4, 5]
}
```

**Ações:**
- Atualiza lista de cabeças ativas
- Recalcula percentual de eficiência

---

## 📊 Relatórios

### `GET /api/estampas-reports/eficiencia-bordado`
Relatório de eficiência do bordado (usa view SQL)

**Query Params:**
- `machine_id` (opcional): Filtrar por máquina
- `data_inicio` (opcional): Data ISO8601
- `data_fim` (opcional): Data ISO8601
- `limit` (opcional): Máx 500, padrão 100

**Resposta:**
```json
{
  "success": true,
  "data": [...],
  "stats": {
    "total_atividades": 25,
    "eficiencia_media": 73,
    "total_pecas": 2500,
    "tempo_total_seg": 36000,
    "tempo_pausas_seg": 1200
  }
}
```

---

### `GET /api/estampas-reports/problemas-por-cabeca`
Relatório de problemas por cabeça (usa view SQL)

**Query Params:**
- `machine_id` (opcional)
- `tipo_problema` (opcional)

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "maquina_codigo": "BORDADEIRA-01",
      "numero_cabeca": 5,
      "tipo_problema": "quebra_linha",
      "total_problemas": 12,
      "tempo_total_parado_seg": 3600,
      "tempo_medio_parado_seg": 300
    }
  ],
  "stats": {
    "total_problemas": 50,
    "tempo_total_parado_horas": 10.5,
    "cabecas_afetadas": 8
  },
  "por_tipo": [
    {
      "tipo_problema": "quebra_linha",
      "total_ocorrencias": 30,
      "tempo_total_seg": 9000
    }
  ]
}
```

---

### `GET /api/estampas-reports/problemas`
Listar todos os problemas (histórico completo)

**Query Params:**
- `machine_id` (opcional)
- `activity_id` (opcional)
- `resolvido` (opcional): `true` / `false`
- `limit` (opcional): Máx 500

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tipo_problema": "quebra_linha",
      "descricao": "...",
      "ts_inicio": "2025-11-03T10:00:00Z",
      "ts_fim": "2025-11-03T10:05:00Z",
      "tempo_parado_seg": 300,
      "machines": { "codigo": "BORDADEIRA-01" },
      "machine_heads": { "numero_cabeca": 5 },
      "users": { "nome": "João Silva" }
    }
  ]
}
```

---

### `GET /api/estampas-reports/dashboard`
Dashboard do módulo Estampas (visão geral)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "machines": [...],  // Máquinas ativas com status de cabeças
    "activities": [...],  // Atividades em andamento
    "problemas_abertos": [...],  // Problemas não resolvidos
    "stats_dia": {
      "pecas_concluidas": 500,
      "tempo_producao_horas": 8.5,
      "eficiencia_media": 75
    }
  }
}
```

---

### `GET /api/estampas-reports/tipos-problema`
Listar tipos de problemas cadastrados

**Resposta:**
```json
{
  "success": true,
  "data": [
    { "tipo": "quebra_linha", "total": 30 },
    { "tipo": "entupimento", "total": 12 },
    { "tipo": "desalinhamento", "total": 8 }
  ]
}
```

---

## 🔐 Autenticação

Todas as rotas requerem autenticação via Bearer Token:

```
Authorization: Bearer <seu-token-jwt>
```

Obter token via `/api/auth/login`

---

## 🎯 Fluxo Completo de Bordado

```
1. GET /api/machines?tipo=bordado
   → Selecionar máquina disponível

2. POST /api/bordado/start
   → Iniciar bordado com cabeças selecionadas

3. [Durante operação] POST /api/bordado/:activity_id/problema
   → Se houver problema em alguma cabeça

4. PUT /api/bordado/problema/:problem_id/resolver
   → Resolver o problema

5. [Ao final] PUT /api/activities/:activity_id/finish
   → Finalizar atividade (rota existente do módulo Acabamento)

6. GET /api/estampas-reports/eficiencia-bordado
   → Visualizar relatório de eficiência
```

---

## ✅ Validações Implementadas

- ✅ Cabeças selecionadas devem existir na máquina
- ✅ Cabeças selecionadas não podem estar com problema
- ✅ Máquina deve estar com status "ativa"
- ✅ Usuário não pode ter duas sessões ativas
- ✅ Cálculo automático de eficiência (cabeças usadas / total)
- ✅ Rastreamento de tempo de pausa por problema
- ✅ Foreign keys com UUID corretos
- ✅ Rate limiting aplicado

---

## 📝 Próximos Passos

1. ✅ Backend implementado
2. ⏳ Testar com Postman Collection
3. ⏳ Implementar frontend React
4. ⏳ Deploy em produção
