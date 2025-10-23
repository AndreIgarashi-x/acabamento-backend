-- =====================================================
-- SCRIPT 3: LIMPAR APENAS ATIVIDADES (Mantém OFs)
-- =====================================================
--
-- OPÇÃO MAIS SEGURA: Limpa apenas atividades e peças, mas MANTÉM as OFs
--
-- ANTES DE EXECUTAR:
-- 1. ✅ Execute o script BACKUP_antes_limpar.sql (recomendado)
-- 2. ✅ Confirme que você quer deletar as atividades mas manter OFs
--
-- O QUE SERÁ DELETADO:
-- - Todas as peças registradas
-- - Todas as atividades (ativas, pausadas, concluídas)
--
-- O QUE SERÁ MANTIDO:
-- - Usuários
-- - Processos
-- - OFs (serão resetadas para status 'aberta')
-- - Estrutura do banco
--
-- USE ESTE SCRIPT SE:
-- - Quer manter as OFs cadastradas
-- - Quer apenas limpar o histórico de produção
-- - Quer "resetar" as OFs para poderem ser trabalhadas novamente
--
-- =====================================================

-- Confirmação de segurança
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  ATENÇÃO: Limpeza de Atividades';
  RAISE NOTICE '';
  RAISE NOTICE 'Este script irá:';
  RAISE NOTICE '  ✅ MANTER as OFs cadastradas';
  RAISE NOTICE '  ✅ Resetar OFs para status "aberta"';
  RAISE NOTICE '  🗑️  DELETAR todas as peças registradas';
  RAISE NOTICE '  🗑️  DELETAR todas as atividades';
  RAISE NOTICE '';
  RAISE NOTICE 'Você tem 5 segundos para cancelar (Ctrl+C)...';
  RAISE NOTICE '';
  PERFORM pg_sleep(5);
  RAISE NOTICE '🔄 INICIANDO LIMPEZA...';
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
  SELECT COUNT(*) INTO count_before FROM pecas_registradas;
  RAISE NOTICE '📦 Deletando % peças registradas...', count_before;

  DELETE FROM pecas_registradas;

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
  SELECT COUNT(*) INTO count_before FROM activities;
  RAISE NOTICE '⏱️  Deletando % atividades...', count_before;

  DELETE FROM activities;

  SELECT COUNT(*) INTO count_after FROM activities;
  RAISE NOTICE '✅ Atividades deletadas: % (Restantes: %)', count_before, count_after;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 3. RESETAR STATUS DAS OFs PARA 'ABERTA'
-- =====================================================
DO $$
DECLARE
  count_em_andamento INTEGER;
  count_concluidas INTEGER;
  count_total INTEGER;
BEGIN
  -- Contar OFs em andamento
  SELECT COUNT(*) INTO count_em_andamento
  FROM ofs
  WHERE status = 'em_andamento';

  -- Contar OFs concluídas
  SELECT COUNT(*) INTO count_concluidas
  FROM ofs
  WHERE status = 'concluida';

  RAISE NOTICE '🔄 Resetando status das OFs...';
  RAISE NOTICE '  - OFs em andamento: %', count_em_andamento;
  RAISE NOTICE '  - OFs concluídas: %', count_concluidas;

  -- Resetar todas para 'aberta'
  UPDATE ofs
  SET status = 'aberta'
  WHERE status IN ('em_andamento', 'concluida');

  -- Contar total de OFs
  SELECT COUNT(*) INTO count_total FROM ofs;

  RAISE NOTICE '✅ Status resetado para "aberta"';
  RAISE NOTICE '  - Total de OFs: %', count_total;
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
  COUNT(*) AS registros,
  'Deletadas' AS status
FROM pecas_registradas

UNION ALL

SELECT
  'Atividades' AS tabela,
  COUNT(*) AS registros,
  'Deletadas' AS status
FROM activities

UNION ALL

SELECT
  'OFs (MANTIDAS)' AS tabela,
  COUNT(*) AS registros,
  'Preservadas' AS status
FROM ofs

UNION ALL

SELECT
  'OFs Abertas' AS tabela,
  COUNT(*) AS registros,
  'Disponíveis' AS status
FROM ofs
WHERE status = 'aberta'

UNION ALL

SELECT
  'Usuários (MANTIDOS)' AS tabela,
  COUNT(*) AS registros,
  'Preservados' AS status
FROM users

UNION ALL

SELECT
  'Processos (MANTIDOS)' AS tabela,
  COUNT(*) AS registros,
  'Preservados' AS status
FROM processes

ORDER BY tabela;

-- Listagem resumida das OFs mantidas
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 OFs MANTIDAS (Resumo):';
  RAISE NOTICE '====================';
END $$;

SELECT
  codigo AS of_codigo,
  referencia,
  descricao,
  quantidade AS pecas,
  status
FROM ofs
ORDER BY codigo
LIMIT 10;

-- Mensagem final
DO $$
DECLARE
  total_ofs INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_ofs FROM ofs;

  RAISE NOTICE '';
  RAISE NOTICE '✅ LIMPEZA CONCLUÍDA!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resultado:';
  RAISE NOTICE '  - % OFs mantidas e resetadas', total_ofs;
  RAISE NOTICE '  - 0 atividades (deletadas)';
  RAISE NOTICE '  - 0 peças registradas (deletadas)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Próximo passo:';
  RAISE NOTICE '  - As OFs estão disponíveis para novas atividades';
  RAISE NOTICE '  - Status: "aberta"';
  RAISE NOTICE '';
END $$;
