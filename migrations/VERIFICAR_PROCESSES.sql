-- Verificar estrutura da tabela processes
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'processes'
ORDER BY ordinal_position;
