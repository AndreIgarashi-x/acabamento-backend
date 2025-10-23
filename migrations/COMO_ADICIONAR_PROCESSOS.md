# 📋 COMO ADICIONAR PROCESSOS AO SISTEMA

## 🎯 OBJETIVO

Adicionar os novos processos ao sistema para que apareçam automaticamente no Timer.

---

## ⚡ MÉTODO RÁPIDO

### 1️⃣ Acesse o Supabase
```
https://supabase.com/dashboard
→ Seu Projeto
→ SQL Editor
```

### 2️⃣ Execute o Script
```
Copie TUDO de: ADICIONAR_processos.sql
Cole no SQL Editor
Clique em "Run" (ou F5)
```

### 3️⃣ Confirme o Resultado
```
✅ 9 novos processos adicionados
✅ Processos aparecem no Timer automaticamente
✅ Usuários podem selecionar ao iniciar atividades
```

**PRONTO! Processos adicionados em 30 segundos!** 🎉

---

## 📋 PROCESSOS ADICIONADOS

1. ✅ **Limpeza e revisão**
2. ✅ **Limpeza com sugador (sem revisão)**
3. ✅ **Revisão (sem limpeza)**
4. ✅ **Travete**
5. ✅ **Pregar botões de pressão**
6. ✅ **Marcação de botão**
7. ✅ **Marcação de caseado**
8. ✅ **Dobragem**
9. ✅ **Etiquetagem**

---

## 🔍 VERIFICAR PROCESSOS

Se quiser ver todos os processos cadastrados:

```sql
SELECT
  ROW_NUMBER() OVER (ORDER BY nome) AS "#",
  nome,
  CASE WHEN ativo THEN '✅ Ativo' ELSE '❌ Inativo' END AS status
FROM processes
ORDER BY nome;
```

---

## 🗑️ REMOVER UM PROCESSO (Se Necessário)

Se precisar remover um processo que foi adicionado por engano:

```sql
-- Opção 1: DESATIVAR (recomendado - mantém histórico)
UPDATE processes
SET ativo = false
WHERE nome = 'Nome do Processo';

-- Opção 2: DELETAR (cuidado - perde histórico)
DELETE FROM processes
WHERE nome = 'Nome do Processo';
```

⚠️ **ATENÇÃO:**
- Se deletar um processo que já foi usado em atividades, pode causar problemas
- Melhor usar a opção 1 (DESATIVAR) em vez de deletar

---

## ✏️ RENOMEAR UM PROCESSO

Se quiser corrigir o nome de um processo:

```sql
UPDATE processes
SET nome = 'Novo Nome Correto'
WHERE nome = 'Nome Antigo';
```

---

## ➕ ADICIONAR MAIS PROCESSOS NO FUTURO

Use este template:

```sql
INSERT INTO processes (nome, ativo)
SELECT 'Nome do Novo Processo', true
WHERE NOT EXISTS (
  SELECT 1 FROM processes WHERE nome = 'Nome do Novo Processo'
);
```

O `WHERE NOT EXISTS` garante que não vai duplicar se o processo já existir.

---

## 📊 O QUE ACONTECE

### ANTES:
```
Timer:
┌─────────────────────┐
│ Processos:          │
│ - Casear            │
│ - Embalagem         │
│ - Costurar          │
│ (processos antigos) │
└─────────────────────┘
```

### DEPOIS:
```
Timer:
┌─────────────────────────────────────┐
│ Processos:                          │
│ - Casear                            │
│ - Dobragem                      ⬅ NOVO
│ - Embalagem                         │
│ - Etiquetagem                   ⬅ NOVO
│ - Limpeza com sugador          ⬅ NOVO
│ - Limpeza e revisão            ⬅ NOVO
│ - Marcação de botão            ⬅ NOVO
│ - Marcação de caseado          ⬅ NOVO
│ - Pregar botões de pressão     ⬅ NOVO
│ - Revisão (sem limpeza)        ⬅ NOVO
│ - Travete                      ⬅ NOVO
│ (ordenados alfabeticamente)        │
└─────────────────────────────────────┘
```

---

## ✅ COMO OS PROCESSOS APARECEM NO TIMER

1. **Automaticamente:** Não precisa reiniciar o servidor ou frontend
2. **Ordenados:** Aparecem em ordem alfabética
3. **Ativos:** Apenas processos com `ativo = true` aparecem
4. **Selecionáveis:** Usuários podem escolher ao iniciar uma nova atividade

---

## ❓ FAQ

### 1. Preciso reiniciar o servidor?
- ❌ NÃO! Os processos aparecem automaticamente no próximo carregamento do Timer

### 2. E se eu executar o script duas vezes?
- ✅ Sem problema! O script usa `WHERE NOT EXISTS`, então não duplica

### 3. Posso editar os nomes depois?
- ✅ SIM! Use o comando `UPDATE` mostrado acima

### 4. O que acontece com processos antigos?
- ✅ São MANTIDOS! Este script apenas adiciona os novos

### 5. Posso adicionar mais processos no futuro?
- ✅ SIM! Use o template mostrado acima

### 6. E se eu deletar um processo por engano?
- ⚠️ Se já foi usado em atividades, pode causar problemas
- ✅ Melhor DESATIVAR em vez de deletar
- ✅ Se deletou, pode adicionar novamente com o mesmo nome

---

## 🚀 APÓS ADICIONAR

Os processos estarão disponíveis para:
1. ✅ Seleção no Timer ao iniciar atividades
2. ✅ Aparecem nos relatórios
3. ✅ Cálculo de TPU por processo
4. ✅ Dashboards e gráficos

**Processos prontos para uso imediato!** 🎉

---

**Versão:** 1.0
**Data:** 2025-01-23
**Autor:** Sistema Acabamento - DCJ Uniformes
