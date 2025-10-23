# 📚 GUIA DE USO - Scripts de Limpeza de Dados

## 🎯 OBJETIVO

Preparar o sistema para produção limpando dados de teste, mantendo apenas a estrutura e configurações essenciais.

---

## 📦 SCRIPTS DISPONÍVEIS

### 1️⃣ `BACKUP_antes_limpar.sql`
**Execute PRIMEIRO, SEMPRE!**
- Cria backup de segurança
- Não altera dados originais
- Pode ser executado múltiplas vezes

### 2️⃣ `LIMPAR_dados_teste.sql`
**Limpeza TOTAL**
- Deleta: OFs, Atividades, Peças
- Mantém: Usuários, Processos, Estrutura

### 3️⃣ `LIMPAR_apenas_atividades.sql`
**Limpeza PARCIAL (Recomendado)**
- Deleta: Atividades, Peças
- Mantém: OFs (resetadas para "aberta"), Usuários, Processos

### 4️⃣ `RESTAURAR_backup.sql`
**Emergência**
- Restaura dados do backup
- Use se algo der errado

---

## 🚀 ORDEM DE EXECUÇÃO

### CENÁRIO 1: Limpeza Total (Deletar TUDO)

```
1. BACKUP_antes_limpar.sql       ← Fazer backup
2. LIMPAR_dados_teste.sql         ← Limpar tudo
3. (RESTAURAR_backup.sql)         ← Se precisar desfazer
```

### CENÁRIO 2: Limpeza Parcial (Manter OFs) ⭐ RECOMENDADO

```
1. BACKUP_antes_limpar.sql       ← Fazer backup
2. LIMPAR_apenas_atividades.sql  ← Limpar apenas atividades
3. (RESTAURAR_backup.sql)         ← Se precisar desfazer
```

---

## 📋 PASSO A PASSO DETALHADO

### ANTES DE COMEÇAR

1. ✅ Acesse o Supabase Dashboard
2. ✅ Vá para SQL Editor
3. ✅ Tenha certeza que está no projeto correto
4. ✅ Avise a equipe (se houver)

---

### PASSO 1: FAZER BACKUP

```sql
-- Copie e cole o conteúdo de:
BACKUP_antes_limpar.sql

-- Clique em "Run" ou F5
-- Aguarde mensagens de confirmação
```

**Resultado esperado:**
```
✅ OFs copiadas para backup: 45
✅ Atividades copiadas para backup: 123
✅ Peças copiadas para backup: 1547
✅ BACKUP CONCLUÍDO COM SUCESSO!
```

---

### PASSO 2: EXECUTAR LIMPEZA

#### Opção A: Limpeza TOTAL

```sql
-- Copie e cole o conteúdo de:
LIMPAR_dados_teste.sql

-- Aguarde 10 segundos (tempo de segurança)
-- Clique em "Run" ou F5
```

#### Opção B: Limpeza PARCIAL (mantém OFs) ⭐

```sql
-- Copie e cole o conteúdo de:
LIMPAR_apenas_atividades.sql

-- Aguarde 5 segundos (tempo de segurança)
-- Clique em "Run" ou F5
```

**Resultado esperado:**
```
✅ Peças deletadas: 1547
✅ Atividades deletadas: 123
✅ OFs deletadas: 45 (ou mantidas/resetadas)
✅ LIMPEZA CONCLUÍDA!
```

---

### PASSO 3: VERIFICAR

Execute estas queries para confirmar:

```sql
-- Verificar o que restou
SELECT 'OFs' AS tabela, COUNT(*) AS total FROM ofs
UNION ALL
SELECT 'Atividades', COUNT(*) FROM activities
UNION ALL
SELECT 'Peças', COUNT(*) FROM pecas_registradas
UNION ALL
SELECT 'Usuários', COUNT(*) FROM users
UNION ALL
SELECT 'Processos', COUNT(*) FROM processes;
```

**Resultado esperado (Limpeza Total):**
```
Tabela       | Total
-------------|------
OFs          | 0
Atividades   | 0
Peças        | 0
Usuários     | 5
Processos    | 8
```

**Resultado esperado (Limpeza Parcial):**
```
Tabela       | Total
-------------|------
OFs          | 45     ← Mantidas!
Atividades   | 0
Peças        | 0
Usuários     | 5
Processos    | 8
```

---

### ❌ SE ALGO DER ERRADO

#### RESTAURAR BACKUP

```sql
-- Copie e cole o conteúdo de:
RESTAURAR_backup.sql

-- Aguarde 10 segundos (tempo de segurança)
-- Clique em "Run" ou F5
```

**Resultado esperado:**
```
✅ OFs restauradas: 45
✅ Atividades restauradas: 123
✅ Peças restauradas: 1547
✅ RESTAURAÇÃO CONCLUÍDA!
```

---

## 🗑️ LIMPAR TABELAS DE BACKUP (Opcional)

Após confirmar que tudo está OK, você pode deletar os backups:

```sql
-- Deletar tabelas de backup
DROP TABLE IF EXISTS backup_ofs_teste;
DROP TABLE IF EXISTS backup_activities_teste;
DROP TABLE IF EXISTS backup_pecas_teste;
```

⚠️ **ATENÇÃO:** Após deletar os backups, não será mais possível restaurar!

---

## 📊 O QUE É MANTIDO vs DELETADO

### ✅ SEMPRE MANTIDO

| Item | Motivo |
|------|--------|
| **Usuários** | Cadastro dos operadores |
| **Processos** | Casear, Embalagem, etc |
| **Estrutura** | Tabelas, views, índices |
| **Views** | v_tpu_por_peca, etc |

### 🗑️ DELETADO (Limpeza Total)

| Item | Por quê |
|------|---------|
| **OFs** | Dados de teste |
| **Atividades** | Cronometragens de teste |
| **Peças** | Registros de teste |

### 🗑️ DELETADO (Limpeza Parcial)

| Item | Por quê |
|------|---------|
| **OFs** | ❌ MANTIDAS (resetadas) |
| **Atividades** | Cronometragens de teste |
| **Peças** | Registros de teste |

---

## 🎓 PERGUNTAS FREQUENTES

### 1. Posso executar o backup múltiplas vezes?

✅ Sim! O script usa `DROP IF EXISTS`, então pode executar quantas vezes quiser.

### 2. O que acontece com usuários e processos?

✅ São SEMPRE mantidos, independente do script usado.

### 3. Qual script devo usar?

- **Limpeza Total**: Se quer recadastrar todas as OFs do zero
- **Limpeza Parcial**: Se quer manter as OFs cadastradas (RECOMENDADO)

### 4. Posso voltar atrás?

✅ Sim, se executou o backup primeiro! Use `RESTAURAR_backup.sql`

### 5. As senhas dos usuários são mantidas?

✅ Sim! Usuários não são afetados pela limpeza.

### 6. E as views (v_tpu_por_peca)?

✅ Views são mantidas. Elas apenas mostrarão dados vazios após a limpeza.

### 7. Preciso executar migrations novamente?

❌ Não! A estrutura do banco é mantida.

---

## 🔒 CHECKLIST DE SEGURANÇA

Antes de executar em PRODUÇÃO:

- [ ] Executei no banco de TESTE primeiro?
- [ ] Fiz o BACKUP?
- [ ] Avisei a equipe?
- [ ] Confirmei que estou no projeto correto?
- [ ] Tenho acesso para restaurar se necessário?
- [ ] Li as mensagens de confirmação?

---

## 📞 SUPORTE

Se algo não funcionar como esperado:

1. ❌ **NÃO ENTRE EM PÂNICO**
2. ✅ Execute `RESTAURAR_backup.sql`
3. ✅ Verifique os logs de erro
4. ✅ Confirme que as tabelas de backup existem:
   ```sql
   SELECT tablename
   FROM pg_tables
   WHERE tablename LIKE 'backup_%';
   ```

---

## 🎉 PRONTO PARA PRODUÇÃO!

Após executar os scripts com sucesso:

✅ Sistema limpo de dados de teste
✅ Estrutura preservada
✅ Usuários e processos mantidos
✅ Pronto para receber dados reais

**Bom trabalho! 🚀**

---

**Versão:** 1.0
**Data:** 2025-01-23
**Autor:** Sistema Acabamento - DCJ Uniformes
