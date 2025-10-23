-- =====================================================
-- SCRIPT 2: LIMPAR DADOS DE TESTE
-- =====================================================
--
-- ⚠️  ATENÇÃO: Este script DELETA dados permanentemente!
--
-- ANTES DE EXECUTAR:
-- 1. ✅ Execute o script BACKUP_antes_limpar.sql
-- 2. ✅ Confirme que você quer deletar TODAS as OFs e atividades
-- 3. ✅ Tenha certeza que está no banco correto
--
-- O QUE SERÁ DELETADO:
-- - Todas as peças registradas
-- - Todas as atividades (ativas, pausadas, concluídas)
-- - Todas as OFs (abertas, em andamento, concluídas)
--
-- O QUE SERÁ MANTIDO:
-- - Usuários
-- - Processos
-- - Estrutura do banco (tabelas, views, índices)
--
-- =====================================================

-- Confirmação de segurança
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⚠️⚠️⚠️  ATENÇÃO  ⚠️⚠️⚠️';
  RAISE NOTICE '';
  RAISE NOTICE 'Este script irá DELETAR PERMANENTEMENTE:';
  RAISE NOTICE '  - Todas as peças registradas';
  RAISE NOTICE '  - Todas as atividades';
  RAISE NOTICE '  - Todas as OFs';
  RAISE NOTICE '';
  RAISE NOTICE 'Você tem 10 segundos para cancelar (Ctrl+C)...';
  RAISE NOTICE '';
  PERFORM pg_sleep(10);
  RAISE NOTICE '🔴 INICIANDO LIMPEZA DOS DADOS...';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 1. LIMPAR PEÇAS REGISTRADAS
-- =====================================================
DO $$
DECLARE
  count_before INTEGER;
  count_after INTEGER;
BEGIN
  -- Contar antes
  SELECT COUNT(*) INTO count_before FROM pecas_registradas;
  RAISE NOTICE '📦 Deletando % peças registradas...', count_before;

  -- Deletar
  DELETE FROM pecas_registradas;

  -- Contar depois
  SELECT COUNT(*) INTO count_after FROM pecas_registradas;
  RAISE NOTICE '✅ Peças deletadas: % (Restantes: %)', count_before, count_after;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 2. LIMPAR ATIVIDADES
-- =====================================================
DO $$
DECLARE
  count_before INTEGER;
  count_after INTEGER;
BEGIN
  -- Contar antes
  SELECT COUNT(*) INTO count_before FROM activities;
  RAISE NOTICE '⏱️  Deletando % atividades...', count_before;

  -- Deletar (CASCADE irá deletar peças relacionadas automaticamente)
  DELETE FROM activities;

  -- Contar depois
  SELECT COUNT(*) INTO count_after FROM activities;
  RAISE NOTICE '✅ Atividades deletadas: % (Restantes: %)', count_before, count_after;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 3. LIMPAR OFs (Ordens de Fabricação)
-- =====================================================
DO $$
DECLARE
  count_before INTEGER;
  count_after INTEGER;
BEGIN
  -- Contar antes
  SELECT COUNT(*) INTO count_before FROM ofs;
  RAISE NOTICE '📋 Deletando % OFs...', count_before;

  -- Deletar
  DELETE FROM ofs;

  -- Contar depois
  SELECT COUNT(*) INTO count_after FROM ofs;
  RAISE NOTICE '✅ OFs deletadas: % (Restantes: %)', count_before, count_after;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 4. VERIFICAÇÃO FINAL
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 VERIFICAÇÃO FINAL:';
  RAISE NOTICE '====================';
END $$;

SELECT
  'Peças Registradas' AS tabela,
  COUNT(*) AS registros_restantes,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ Limpa'
    ELSE '⚠️ Ainda há registros!'
  END AS status
FROM pecas_registradas

UNION ALL

SELECT
  'Atividades' AS tabela,
  COUNT(*) AS registros_restantes,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ Limpa'
    ELSE '⚠️ Ainda há registros!'
  END AS status
FROM activities

UNION ALL

SELECT
  'OFs' AS tabela,
  COUNT(*) AS registros_restantes,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ Limpa'
    ELSE '⚠️ Ainda há registros!'
  END AS status
FROM ofs

UNION ALL

SELECT
  'Usuários (MANTIDOS)' AS tabela,
  COUNT(*) AS registros_restantes,
  '✅ Preservados' AS status
FROM users

UNION ALL

SELECT
  'Processos (MANTIDOS)' AS tabela,
  COUNT(*) AS registros_restantes,
  '✅ Preservados' AS status
FROM processes

ORDER BY tabela;

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ LIMPEZA CONCLUÍDA!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 O que foi mantido:';
  RAISE NOTICE '  - Usuários cadastrados';
  RAISE NOTICE '  - Processos (Casear, Embalagem, etc)';
  RAISE NOTICE '  - Estrutura do banco (tabelas, views, índices)';
  RAISE NOTICE '';
  RAISE NOTICE '🗑️  O que foi deletado:';
  RAISE NOTICE '  - Todas as peças registradas';
  RAISE NOTICE '  - Todas as atividades';
  RAISE NOTICE '  - Todas as OFs';
  RAISE NOTICE '';
  RAISE NOTICE '💾 Se precisar restaurar: Execute RESTAURAR_backup.sql';
  RAISE NOTICE '';
END $$;
