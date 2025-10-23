# 🗑️ COMO ZERAR O SISTEMA

## 🎯 OBJETIVO

Limpar **TUDO** - Admin (OFs) e Dashboard (Atividades) voltam para ZERO.

---

## ⚡ MÉTODO RÁPIDO (SEM BACKUP)

### 1️⃣ Acesse o Supabase
```
https://supabase.com/dashboard
→ Seu Projeto
→ SQL Editor
```

### 2️⃣ Execute o Script
```
Copie TUDO de: ZERAR_TUDO_producao.sql
Cole no SQL Editor
Clique em "Run" (ou F5)
```

### 3️⃣ Confirme o Resultado
```
✅ OFs: 0
✅ Atividades: 0
✅ Peças: 0
✅ Usuários: Mantidos
✅ Processos: Mantidos
```

**PRONTO! Sistema zerado em 30 segundos!** 🎉

---

## 🔒 MÉTODO SEGURO (COM BACKUP)

Se você quiser ter como voltar atrás:

### 1️⃣ Fazer Backup (Opcional)
```sql
-- Execute: BACKUP_simples.sql
-- Cria: backup_ofs, backup_activities, backup_pecas
```

### 2️⃣ Zerar Sistema
```sql
-- Execute: ZERAR_TUDO_producao.sql
```

### 3️⃣ Se Precisar Restaurar
```sql
-- Deletar dados atuais
DELETE FROM pecas_registradas;
DELETE FROM activities;
DELETE FROM ofs;

-- Restaurar do backup
INSERT INTO ofs SELECT * FROM backup_ofs;
INSERT INTO activities SELECT * FROM backup_activities;
INSERT INTO pecas_registradas SELECT * FROM backup_pecas;
```

---

## 📊 O QUE ACONTECE

### ANTES:
```
Admin (OFs):
┌─────────────────────┐
│ OF 011341 - 172 pçs │
│ OF 011342 - 85 pçs  │
│ OF 011343 - 120 pçs │
│ ... (45 OFs)        │
└─────────────────────┘

Dashboard:
┌─────────────────────┐
│ 123 atividades      │
│ 1547 peças          │
│ Gráficos com dados  │
└─────────────────────┘
```

### DEPOIS:
```
Admin (OFs):
┌─────────────────────┐
│ Nenhuma OF          │
│ encontrada          │
└─────────────────────┘

Dashboard:
┌─────────────────────┐
│ 0 atividades        │
│ 0 peças             │
│ Gráficos vazios     │
└─────────────────────┘
```

---

## ✅ MANTIDO

- ✅ **Usuários** (Andre, REGIMARI.GOMIDE, etc)
- ✅ **Processos** (Casear, Embalagem, Costurar, etc)
- ✅ **Estrutura do banco** (tabelas, views, índices)

---

## 🗑️ DELETADO

- ❌ **Todas as OFs** (abertas, em andamento, concluídas)
- ❌ **Todas as atividades** (ativas, pausadas, concluídas)
- ❌ **Todas as peças registradas**

---

## ❓ FAQ

### 1. Posso desfazer?
- ✅ SIM, se fez backup antes
- ❌ NÃO, se não fez backup

### 2. As senhas dos usuários são mantidas?
- ✅ SIM! Usuários não são afetados

### 3. Preciso recriar processos?
- ❌ NÃO! Processos são mantidos

### 4. E se eu quiser apenas limpar atividades?
- Use: `LIMPAR_apenas_atividades.sql` (mantém OFs)

### 5. Quanto tempo demora?
- ⚡ Menos de 1 minuto

---

## ⚠️ ATENÇÃO

⚠️ **ESTE SCRIPT DELETA PERMANENTEMENTE!**

Certifique-se de:
- [ ] Estar no projeto correto
- [ ] Realmente querer deletar TUDO
- [ ] Ter feito backup (se quiser voltar)
- [ ] Avisar a equipe (se houver)

---

## 🚀 APÓS ZERAR

O sistema estará pronto para:
1. ✅ Cadastrar OFs reais de produção
2. ✅ Iniciar cronometragens reais
3. ✅ Registrar peças reais

**Sistema 100% limpo para produção!** 🎉
