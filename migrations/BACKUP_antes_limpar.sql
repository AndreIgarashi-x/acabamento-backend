-- =====================================================
-- SCRIPT 1: BACKUP DOS DADOS ANTES DE LIMPAR
-- =====================================================
--
-- OBJETIVO: Criar backup de segurança antes de deletar dados de teste
--
-- QUANDO EXECUTAR: SEMPRE executar este script ANTES de limpar dados
--
-- IMPORTANTE:
-- - Este script cria tabelas temporárias de backup
-- - Os dados originais NÃO são alterados
-- - Pode ser executado múltiplas vezes (DROP IF EXISTS)
--
-- =====================================================

-- Mensagem inicial
DO $$
BEGIN
  RAISE NOTICE '🔄 INICIANDO BACKUP DOS DADOS...';
  RAISE NOTICE 'Data/Hora: %', NOW();
END $$;

-- =====================================================
-- 1. BACKUP DE OFs (Ordens de Fabricação)
-- =====================================================
DROP TABLE IF EXISTS backup_ofs_teste CASCADE;

CREATE TABLE backup_ofs_teste AS
SELECT * FROM ofs;

-- Verificar backup de OFs
DO $$
DECLARE
  count_ofs INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_ofs FROM backup_ofs_teste;
  RAISE NOTICE '✅ OFs copiadas para backup: %', count_ofs;
END $$;

-- =====================================================
-- 2. BACKUP DE ATIVIDADES
-- =====================================================
DROP TABLE IF EXISTS backup_activities_teste CASCADE;

CREATE TABLE backup_activities_teste AS
SELECT * FROM activities;

-- Verificar backup de atividades
DO $$
DECLARE
  count_activities INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_activities FROM backup_activities_teste;
  RAISE NOTICE '✅ Atividades copiadas para backup: %', count_activities;
END $$;

-- =====================================================
-- 3. BACKUP DE PEÇAS REGISTRADAS
-- =====================================================
DROP TABLE IF EXISTS backup_pecas_teste CASCADE;

CREATE TABLE backup_pecas_teste AS
SELECT * FROM pecas_registradas;

-- Verificar backup de peças
DO $$
DECLARE
  count_pecas INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_pecas FROM backup_pecas_teste;
  RAISE NOTICE '✅ Peças copiadas para backup: %', count_pecas;
END $$;

-- =====================================================
-- 4. RESUMO DO BACKUP
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESUMO DO BACKUP:';
  RAISE NOTICE '====================';
END $$;

SELECT
  'OFs' AS tabela,
  COUNT(*) AS total_registros
FROM backup_ofs_teste

UNION ALL

SELECT
  'Atividades' AS tabela,
  COUNT(*) AS total_registros
FROM backup_activities_teste

UNION ALL

SELECT
  'Peças Registradas' AS tabela,
  COUNT(*) AS total_registros
FROM backup_pecas_teste

ORDER BY tabela;

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ BACKUP CONCLUÍDO COM SUCESSO!';
  RAISE NOTICE 'Tabelas criadas:';
  RAISE NOTICE '  - backup_ofs_teste';
  RAISE NOTICE '  - backup_activities_teste';
  RAISE NOTICE '  - backup_pecas_teste';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  PRÓXIMO PASSO: Execute o script de limpeza';
  RAISE NOTICE '';
END $$;
