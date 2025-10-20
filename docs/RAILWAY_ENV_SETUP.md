# Configuração de Variáveis de Ambiente no Railway

## Problema
O Railway não carrega o arquivo `.env` automaticamente. As variáveis precisam ser configuradas manualmente no painel.

## Solução: Adicionar Variáveis no Railway

### 1. Acessar o Painel do Railway

1. Acesse: https://railway.app
2. Faça login
3. Selecione seu projeto do backend
4. Clique na aba **"Variables"**

### 2. Adicionar Variáveis Obrigatórias

Copie as variáveis abaixo e adicione no Railway:

#### **Supabase (OBRIGATÓRIO)**
```
SUPABASE_URL=https://ibdjuowuqmvzqiwthawk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZGp1b3d1cW12enFpd3RoYXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1MTI4MjAsImV4cCI6MjA0NDA4ODgyMH0.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZGp1b3d1cW12enFpd3RoYXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1MTI4MjAsImV4cCI6MjA0NDA4ODgyMH0
SUPABASE_SERVICE_KEY=sb_secret_ZwrpIGFqP0LzNWdcXll-Dg_N9S8jsiJ
```

#### **JWT (OBRIGATÓRIO)**
```
JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZGp1b3d1cW12enFpd3RoYXdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAzODc5OSwiZXhwIjoyMDc1NjE0Nzk5fQ.wFc_tQYWkDQzzg1WAprKnoy9ociQzrG-IbSzyqoAECM
JWT_EXPIRES_IN=12h
JWT_REFRESH_EXPIRES_IN=7d
```

#### **Aplicação (OBRIGATÓRIO)**
```
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://acabamento-frontend.vercel.app
TZ=America/Sao_Paulo
```

#### **Rate Limiting (OPCIONAL)**
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### **Relatórios (OPCIONAL)**
```
DAILY_REPORT_CRON=0 18 * * *
REPORT_EMAIL_TO=regi@dcjuniformes.com.br
```

#### **OpenAI (OPCIONAL - Para Assistente IA)**
```
OPENAI_API_KEY=sua_chave_openai_aqui
```

### 3. Como Adicionar no Railway

**Método 1: Interface Web**
1. Clique em "Variables"
2. Clique em "+ New Variable"
3. Cole o nome da variável (ex: `SUPABASE_URL`)
4. Cole o valor
5. Clique em "Add"
6. Repita para cada variável

**Método 2: Raw Editor (Mais Rápido)**
1. Clique em "Variables"
2. Clique em "Raw Editor"
3. Cole todas as variáveis de uma vez:

```
SUPABASE_URL=https://ibdjuowuqmvzqiwthawk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZGp1b3d1cW12enFpd3RoYXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1MTI4MjAsImV4cCI6MjA0NDA4ODgyMH0.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZGp1b3d1cW12enFpd3RoYXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg1MTI4MjAsImV4cCI6MjA0NDA4ODgyMH0
SUPABASE_SERVICE_KEY=sb_secret_ZwrpIGFqP0LzNWdcXll-Dg_N9S8jsiJ
JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZGp1b3d1cW12enFpd3RoYXdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAzODc5OSwiZXhwIjoyMDc1NjE0Nzk5fQ.wFc_tQYWkDQzzg1WAprKnoy9ociQzrG-IbSzyqoAECM
JWT_EXPIRES_IN=12h
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://acabamento-frontend.vercel.app
TZ=America/Sao_Paulo
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
DAILY_REPORT_CRON=0 18 * * *
REPORT_EMAIL_TO=regi@dcjuniformes.com.br
```

4. Clique em "Save"

### 4. Redeploy da Aplicação

Após adicionar as variáveis:

1. **Opção 1:** Railway redeploy automático
   - Railway detecta mudanças nas variáveis
   - Faz redeploy automaticamente

2. **Opção 2:** Redeploy manual
   - Clique nos 3 pontinhos (...) no projeto
   - Clique em "Redeploy"

### 5. Verificar Deploy

1. Aguarde o build finalizar (1-3 minutos)
2. Acesse os logs clicando em "Deployments" > último deploy
3. Verifique se não há mais erros de variáveis faltando
4. Teste a API acessando: `https://seu-backend.railway.app/health`

### 6. Troubleshooting

#### Erro: "Variáveis de ambiente faltando"
- Verifique se todas as variáveis OBRIGATÓRIAS foram adicionadas
- Certifique-se de que não há espaços extras nos valores
- Verifique se clicou em "Save" após adicionar

#### Erro: "CORS policy"
- Adicione o URL do frontend em `FRONTEND_URL`
- Formato: `https://seu-frontend.vercel.app` (sem barra no final)

#### API não responde
- Verifique se `PORT=3000` está configurado
- Verifique os logs do Railway para erros

## Checklist Final

- [ ] SUPABASE_URL adicionada
- [ ] SUPABASE_ANON_KEY adicionada
- [ ] SUPABASE_SERVICE_KEY adicionada
- [ ] JWT_SECRET adicionada
- [ ] NODE_ENV=production
- [ ] FRONTEND_URL com URL correto do Vercel
- [ ] Deploy finalizado com sucesso
- [ ] API respondendo em /health
- [ ] Login funcionando no frontend

## Notas Importantes

1. **Nunca commite** o arquivo `.env` no Git
2. `.env` é apenas para desenvolvimento local
3. Railway **sempre** usa as variáveis do painel
4. Toda mudança nas variáveis causa um redeploy
5. As chaves do Supabase são seguras (são específicas do projeto)
