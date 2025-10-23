-- =====================================================
-- SCRIPT 4: RESTAURAR BACKUP (Se algo der errado)
-- =====================================================
--
-- QUANDO USAR:
-- - Se você deletou dados por engano
-- - Se precisa voltar ao estado anterior
-- - Se o script de limpeza causou problemas
--
-- REQUISITO:
-- - Você DEVE ter executado BACKUP_antes_limpar.sql primeiro
-- - As tabelas de backup devem existir:
--   * backup_ofs_teste
--   * backup_activities_teste
--   * backup_pecas_teste
--
-- ATENÇÃO:
-- - Este script NÃO faz merge de dados
-- - Ele SUBSTITUI os dados atuais pelos do backup
-- - Dados criados APÓS o backup serão PERDIDOS
--
-- =====================================================

-- Verificar se backups existem
DO $$
DECLARE
  backup_ofs_exists BOOLEAN;
  backup_activities_exists BOOLEAN;
  backup_pecas_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 VERIFICANDO BACKUPS...';
  RAISE NOTICE '';

  -- Verificar tabela backup_ofs_teste
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'backup_ofs_teste'
  ) INTO backup_ofs_exists;

  -- Verificar tabela backup_activities_teste
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'backup_activities_teste'
  ) INTO backup_activities_exists;

  -- Verificar tabela backup_pecas_teste
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'backup_pecas_teste'
  ) INTO backup_pecas_exists;

  -- Mostrar resultados
  IF backup_ofs_exists THEN
    RAISE NOTICE '✅ backup_ofs_teste encontrada';
  ELSE
    RAISE NOTICE '❌ backup_ofs_teste NÃO encontrada';
  END IF;

  IF backup_activities_exists THEN
    RAISE NOTICE '✅ backup_activities_teste encontrada';
  ELSE
    RAISE NOTICE '❌ backup_activities_teste NÃO encontrada';
  END IF;

  IF backup_pecas_exists THEN
    RAISE NOTICE '✅ backup_pecas_teste encontrada';
  ELSE
    RAISE NOTICE '❌ backup_pecas_teste NÃO encontrada';
  END IF;

  -- Abortar se algum backup não existir
  IF NOT (backup_ofs_exists AND backup_activities_exists AND backup_pecas_exists) THEN
    RAISE EXCEPTION 'ERRO: Tabelas de backup não encontradas! Execute BACKUP_antes_limpar.sql primeiro.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Todos os backups encontrados!';
  RAISE NOTICE '';
END $$;

-- Confirmação de segurança
DO $$
BEGIN
  RAISE NOTICE '⚠️⚠️⚠️  ATENÇÃO  ⚠️⚠️⚠️';
  RAISE NOTICE '';
  RAISE NOTICE 'Este script irá:';
  RAISE NOTICE '  1. DELETAR todos os dados atuais';
  RAISE NOTICE '  2. RESTAURAR dados do backup';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Dados criados APÓS o backup serão PERDIDOS!';
  RAISE NOTICE '';
  RAISE NOTICE 'Você tem 10 segundos para cancelar (Ctrl+C)...';
  RAISE NOTICE '';
  PERFORM pg_sleep(10);
  RAISE NOTICE '🔄 INICIANDO RESTAURAÇÃO...';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 1. LIMPAR DADOS ATUAIS
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '🗑️  PASSO 1: Limpando dados atuais...';
  RAISE NOTICE '';
END $$;

-- Deletar peças (filho de activities)
DELETE FROM pecas_registradas;

-- Deletar atividades
DELETE FROM activities;

-- Deletar OFs
DELETE FROM ofs;

DO $$
BEGIN
  RAISE NOTICE '✅ Dados atuais removidos';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 2. RESTAURAR OFs
-- =====================================================
DO $$
DECLARE
  count_ofs INTEGER;
BEGIN
  RAISE NOTICE '📋 PASSO 2: Restaurando OFs...';

  INSERT INTO ofs
  SELECT * FROM backup_ofs_teste;

  SELECT COUNT(*) INTO count_ofs FROM ofs;
  RAISE NOTICE '✅ OFs restauradas: %', count_ofs;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 3. RESTAURAR ATIVIDADES
-- =====================================================
DO $$
DECLARE
  count_activities INTEGER;
BEGIN
  RAISE NOTICE '⏱️  PASSO 3: Restaurando Atividades...';

  INSERT INTO activities
  SELECT * FROM backup_activities_teste;

  SELECT COUNT(*) INTO count_activities FROM activities;
  RAISE NOTICE '✅ Atividades restauradas: %', count_activities;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 4. RESTAURAR PEÇAS REGISTRADAS
-- =====================================================
DO $$
DECLARE
  count_pecas INTEGER;
BEGIN
  RAISE NOTICE '📦 PASSO 4: Restaurando Peças Registradas...';

  INSERT INTO pecas_registradas
  SELECT * FROM backup_pecas_teste;

  SELECT COUNT(*) INTO count_pecas FROM pecas_registradas;
  RAISE NOTICE '✅ Peças restauradas: %', count_pecas;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 5. VERIFICAÇÃO FINAL
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 VERIFICAÇÃO FINAL:';
  RAISE NOTICE '====================';
END $$;

SELECT
  'OFs' AS tabela,
  (SELECT COUNT(*) FROM ofs) AS restaurados,
  (SELECT COUNT(*) FROM backup_ofs_teste) AS no_backup,
  CASE
    WHEN (SELECT COUNT(*) FROM ofs) = (SELECT COUNT(*) FROM backup_ofs_teste)
    THEN '✅ OK'
    ELSE '⚠️ Divergência!'
  END AS status

UNION ALL

SELECT
  'Atividades' AS tabela,
  (SELECT COUNT(*) FROM activities) AS restaurados,
  (SELECT COUNT(*) FROM backup_activities_teste) AS no_backup,
  CASE
    WHEN (SELECT COUNT(*) FROM activities) = (SELECT COUNT(*) FROM backup_activities_teste)
    THEN '✅ OK'
    ELSE '⚠️ Divergência!'
  END AS status

UNION ALL

SELECT
  'Peças Registradas' AS tabela,
  (SELECT COUNT(*) FROM pecas_registradas) AS restaurados,
  (SELECT COUNT(*) FROM backup_pecas_teste) AS no_backup,
  CASE
    WHEN (SELECT COUNT(*) FROM pecas_registradas) = (SELECT COUNT(*) FROM backup_pecas_teste)
    THEN '✅ OK'
    ELSE '⚠️ Divergência!'
  END AS status;

-- Mensagem final
DO $$
DECLARE
  count_ofs INTEGER;
  count_activities INTEGER;
  count_pecas INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_ofs FROM ofs;
  SELECT COUNT(*) INTO count_activities FROM activities;
  SELECT COUNT(*) INTO count_pecas FROM pecas_registradas;

  RAISE NOTICE '';
  RAISE NOTICE '✅ RESTAURAÇÃO CONCLUÍDA!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Dados restaurados:';
  RAISE NOTICE '  - OFs: %', count_ofs;
  RAISE NOTICE '  - Atividades: %', count_activities;
  RAISE NOTICE '  - Peças: %', count_pecas;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Sistema restaurado ao estado do backup';
  RAISE NOTICE '';
  RAISE NOTICE '💡 DICA: Se quiser manter os backups, não os delete.';
  RAISE NOTICE '    Se quiser removê-los:';
  RAISE NOTICE '      DROP TABLE backup_ofs_teste;';
  RAISE NOTICE '      DROP TABLE backup_activities_teste;';
  RAISE NOTICE '      DROP TABLE backup_pecas_teste;';
  RAISE NOTICE '';
END $$;
