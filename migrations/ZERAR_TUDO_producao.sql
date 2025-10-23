-- =====================================================
-- ZERAR TUDO - LIMPAR SISTEMA COMPLETO
-- =====================================================
--
-- ⚠️⚠️⚠️  ATENÇÃO: Este script DELETA TUDO!  ⚠️⚠️⚠️
--
-- O QUE SERÁ DELETADO:
-- ✅ TODAS as OFs (Admin)
-- ✅ TODAS as atividades (Dashboard)
-- ✅ TODAS as peças registradas
--
-- O QUE SERÁ MANTIDO:
-- ✅ Usuários (Andre, REGIMARI.GOMIDE, etc)
-- ✅ Processos (Casear, Embalagem, etc)
-- ✅ Estrutura do banco (tabelas, views)
--
-- =====================================================
-- RESULTADO: Páginas Admin e Dashboard ZERADAS
-- =====================================================

-- Mostrar o que vai ser deletado
SELECT
  'ANTES DA LIMPEZA:' AS status,
  '' AS tabela,
  NULL AS total
UNION ALL
SELECT
  '',
  'OFs (Admin)',
  COUNT(*)
FROM ofs
UNION ALL
SELECT
  '',
  'Atividades (Dashboard)',
  COUNT(*)
FROM activities
UNION ALL
SELECT
  '',
  'Peças Registradas',
  COUNT(*)
FROM pecas_registradas;

-- =====================================================
-- DELETAR TUDO
-- =====================================================

-- 1. Deletar peças registradas
DELETE FROM pecas_registradas;

-- 2. Deletar atividades (Dashboard)
DELETE FROM activities;

-- 3. Deletar OFs (Admin)
DELETE FROM ofs;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT
  'DEPOIS DA LIMPEZA:' AS status,
  '' AS tabela,
  NULL AS total
UNION ALL
SELECT
  '',
  'OFs (Admin)',
  COUNT(*)
FROM ofs
UNION ALL
SELECT
  '',
  'Atividades (Dashboard)',
  COUNT(*)
FROM activities
UNION ALL
SELECT
  '',
  'Peças Registradas',
  COUNT(*)
FROM pecas_registradas
UNION ALL
SELECT
  '',
  'Usuários (MANTIDOS)',
  COUNT(*)
FROM users
UNION ALL
SELECT
  '',
  'Processos (MANTIDOS)',
  COUNT(*)
FROM processes;

-- =====================================================
-- MENSAGEM FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ SISTEMA ZERADO COM SUCESSO!';
  RAISE NOTICE '';
  RAISE NOTICE '🗑️  Deletado:';
  RAISE NOTICE '  - OFs: TODAS';
  RAISE NOTICE '  - Atividades: TODAS';
  RAISE NOTICE '  - Peças: TODAS';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Mantido:';
  RAISE NOTICE '  - Usuários: SIM';
  RAISE NOTICE '  - Processos: SIM';
  RAISE NOTICE '';
  RAISE NOTICE '📄 Página Admin: ZERADA';
  RAISE NOTICE '📊 Dashboard: ZERADO';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Sistema pronto para dados de produção!';
  RAISE NOTICE '';
END $$;
