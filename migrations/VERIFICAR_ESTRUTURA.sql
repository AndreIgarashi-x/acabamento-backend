-- Script para verificar a estrutura da tabela users
-- Execute este script PRIMEIRO para descobrir os nomes das colunas

SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
