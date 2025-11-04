-- ==========================================================
-- MIGRATION 005: Atualizar Processos de Costura
-- Data: 2025-11-04
-- Descrição: Substituir processos de Costura pelos corretos
-- ==========================================================

BEGIN;

-- ===========================
-- 1. DELETAR OFs DO MÓDULO COSTURA
-- ===========================
DO $$
DECLARE
  v_modulo_costura_id INTEGER;
  v_ofs_deletadas INTEGER;
BEGIN
  -- Obter ID do módulo Costura
  SELECT id INTO v_modulo_costura_id FROM modulos WHERE codigo = 'costura';

  -- Deletar OFs de Costura
  DELETE FROM ofs WHERE modulo_id = v_modulo_costura_id;

  GET DIAGNOSTICS v_ofs_deletadas = ROW_COUNT;

  RAISE NOTICE '🗑️  % OFs de Costura deletadas', v_ofs_deletadas;
END $$;

-- ===========================
-- 2. DELETAR PROCESSOS ANTIGOS DE COSTURA
-- ===========================
DO $$
DECLARE
  v_modulo_costura_id INTEGER;
  v_processos_deletados INTEGER;
BEGIN
  -- Obter ID do módulo Costura
  SELECT id INTO v_modulo_costura_id FROM modulos WHERE codigo = 'costura';

  -- Deletar processos antigos
  DELETE FROM processes WHERE modulo_id = v_modulo_costura_id;

  GET DIAGNOSTICS v_processos_deletados = ROW_COUNT;

  RAISE NOTICE '🗑️  % processos antigos deletados', v_processos_deletados;
END $$;

-- ===========================
-- 3. INSERIR NOVOS PROCESSOS DE COSTURA
-- ===========================
DO $$
DECLARE
  v_modulo_costura_id INTEGER;
BEGIN
  -- Obter ID do módulo Costura
  SELECT id INTO v_modulo_costura_id FROM modulos WHERE codigo = 'costura';

  -- Inserir novos processos
  INSERT INTO processes (nome, modulo_id, ativo)
  VALUES
    ('Colocação de refletivo', v_modulo_costura_id, true),
    ('Colocação de peitilho', v_modulo_costura_id, true),
    ('Colocação de bolso', v_modulo_costura_id, true),
    ('Colocação de gola', v_modulo_costura_id, true),
    ('Fechamento de ombro', v_modulo_costura_id, true),
    ('Colocação de manga', v_modulo_costura_id, true),
    ('Fechamento lateral', v_modulo_costura_id, true),
    ('Colocação de punho', v_modulo_costura_id, true),
    ('Barra', v_modulo_costura_id, true);

  RAISE NOTICE '✅ 9 novos processos de Costura criados!';
END $$;

-- ===========================
-- 4. VERIFICAÇÃO FINAL
-- ===========================
DO $$
DECLARE
  v_modulo_costura_id INTEGER;
  v_total_processos INTEGER;
  v_total_ofs INTEGER;
BEGIN
  -- Obter ID do módulo Costura
  SELECT id INTO v_modulo_costura_id FROM modulos WHERE codigo = 'costura';

  -- Contar processos
  SELECT COUNT(*) INTO v_total_processos
  FROM processes
  WHERE modulo_id = v_modulo_costura_id;

  -- Contar OFs
  SELECT COUNT(*) INTO v_total_ofs
  FROM ofs
  WHERE modulo_id = v_modulo_costura_id;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration 005 concluída com sucesso!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🧵 Módulo Costura ID: %', v_modulo_costura_id;
  RAISE NOTICE '📋 Total de processos: %', v_total_processos;
  RAISE NOTICE '📦 Total de OFs: %', v_total_ofs;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Listar processos
  RAISE NOTICE '📝 Processos de Costura:';
  FOR i IN
    SELECT nome FROM processes
    WHERE modulo_id = v_modulo_costura_id
    ORDER BY id
  LOOP
    RAISE NOTICE '   • %', i.nome;
  END LOOP;

  RAISE NOTICE '';
END $$;

COMMIT;
