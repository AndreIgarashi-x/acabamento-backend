-- ==========================================================
-- MIGRATIONS CONSOLIDADAS: Módulo Costura para Produção
-- Data: 2025-11-04
-- Descrição: Criar módulo Costura com processos corretos
-- ==========================================================

BEGIN;

-- ===========================
-- 1. CRIAR MÓDULO COSTURA
-- ===========================
INSERT INTO modulos (codigo, nome_exibicao, ativo)
VALUES ('costura', 'Costura', true)
ON CONFLICT (codigo) DO NOTHING;

-- ===========================
-- 2. CRIAR PROCESSOS DE COSTURA (VERSÃO INICIAL - SERÁ SUBSTITUÍDA)
-- ===========================
DO $$
DECLARE
  v_modulo_id INTEGER;
BEGIN
  -- Obter ID do módulo Costura
  SELECT id INTO v_modulo_id FROM modulos WHERE codigo = 'costura';

  -- Inserir processos temporários (serão deletados depois)
  INSERT INTO processes (nome, modulo_id, ativo)
  VALUES
    ('Temp 1', v_modulo_id, true),
    ('Temp 2', v_modulo_id, true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Módulo Costura criado!';
END $$;

-- ===========================
-- 3. DELETAR PROCESSOS TEMPORÁRIOS
-- ===========================
DO $$
DECLARE
  v_modulo_costura_id INTEGER;
  v_processos_deletados INTEGER;
BEGIN
  -- Obter ID do módulo Costura
  SELECT id INTO v_modulo_costura_id FROM modulos WHERE codigo = 'costura';

  -- Deletar processos temporários
  DELETE FROM processes WHERE modulo_id = v_modulo_costura_id;

  GET DIAGNOSTICS v_processos_deletados = ROW_COUNT;

  RAISE NOTICE '🗑️  % processos temporários deletados', v_processos_deletados;
END $$;

-- ===========================
-- 4. INSERIR PROCESSOS CORRETOS DE COSTURA
-- ===========================
DO $$
DECLARE
  v_modulo_costura_id INTEGER;
BEGIN
  -- Obter ID do módulo Costura
  SELECT id INTO v_modulo_costura_id FROM modulos WHERE codigo = 'costura';

  -- Inserir novos processos corretos
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
-- 5. VERIFICAÇÃO FINAL
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
  RAISE NOTICE '✅ Migrations Costura concluídas!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🧵 Módulo Costura ID: %', v_modulo_costura_id;
  RAISE NOTICE '📋 Total de processos: %', v_total_processos;
  RAISE NOTICE '📦 Total de OFs: %', v_total_ofs;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ===========================
-- 6. LISTAR PROCESSOS CRIADOS (OPCIONAL)
-- ===========================
-- Comentado para evitar problemas - você pode verificar manualmente depois
-- SELECT nome FROM processes WHERE modulo_id = (SELECT id FROM modulos WHERE codigo = 'costura') ORDER BY id;

COMMIT;
