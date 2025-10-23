-- =====================================================
-- BACKUP RÁPIDO (Opcional - Execute antes de zerar)
-- =====================================================
--
-- Este script cria um backup simples antes de limpar
-- Execute APENAS SE quiser ter como voltar atrás
--
-- =====================================================

-- Backup de OFs
CREATE TABLE IF NOT EXISTS backup_ofs AS
SELECT * FROM ofs;

-- Backup de Atividades
CREATE TABLE IF NOT EXISTS backup_activities AS
SELECT * FROM activities;

-- Backup de Peças
CREATE TABLE IF NOT EXISTS backup_pecas AS
SELECT * FROM pecas_registradas;

-- Verificar backup
SELECT
  'Backup criado:' AS status,
  '' AS tabela,
  NULL AS total
UNION ALL
SELECT
  '',
  'OFs',
  COUNT(*)
FROM backup_ofs
UNION ALL
SELECT
  '',
  'Atividades',
  COUNT(*)
FROM backup_activities
UNION ALL
SELECT
  '',
  'Peças',
  COUNT(*)
FROM backup_pecas;

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '✅ BACKUP CRIADO!';
  RAISE NOTICE 'Tabelas: backup_ofs, backup_activities, backup_pecas';
  RAISE NOTICE 'Agora pode executar: ZERAR_TUDO_producao.sql';
END $$;
