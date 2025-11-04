-- ==========================================================
-- MIGRATION 004: Adicionar Módulo Costura
-- Data: 2025-11-04
-- Descrição: Criar módulo Costura (idêntico ao Acabamento)
-- ==========================================================

BEGIN;

-- ===========================
-- 1. CRIAR MÓDULO COSTURA
-- ===========================
INSERT INTO modulos (codigo, nome, descricao, ativo)
VALUES ('costura', 'Costura', 'Gestão de OFs e processos de costura', true)
ON CONFLICT (codigo) DO NOTHING;

-- ===========================
-- 2. CRIAR PROCESSOS DE COSTURA
-- ===========================
DO $$
DECLARE
  v_modulo_id INTEGER;
BEGIN
  -- Obter ID do módulo Costura
  SELECT id INTO v_modulo_id FROM modulos WHERE codigo = 'costura';

  -- Inserir processos de costura
  INSERT INTO processes (nome, descricao, modulo_id, ordem, ativo)
  VALUES
    ('Corte', 'Corte de tecidos e materiais', v_modulo_id, 1, true),
    ('Preparação', 'Preparação das peças para costura', v_modulo_id, 2, true),
    ('Costura Reta', 'Costura reta básica', v_modulo_id, 3, true),
    ('Costura Overloque', 'Acabamento com overloque', v_modulo_id, 4, true),
    ('Galoneira', 'Acabamento com galoneira', v_modulo_id, 5, true),
    ('Pregar Botão', 'Colocação de botões', v_modulo_id, 6, true),
    ('Caseado', 'Fazer casas para botões', v_modulo_id, 7, true),
    ('Travete', 'Reforço com travetes', v_modulo_id, 8, true),
    ('Montagem', 'Montagem final da peça', v_modulo_id, 9, true),
    ('Revisão', 'Revisão final da peça costurada', v_modulo_id, 10, true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Processos de Costura criados!';
END $$;

-- ===========================
-- 3. VERIFICAÇÃO
-- ===========================
DO $$
DECLARE
  v_modulo_id INTEGER;
  v_total_processos INTEGER;
BEGIN
  SELECT id INTO v_modulo_id FROM modulos WHERE codigo = 'costura';

  SELECT COUNT(*) INTO v_total_processos
  FROM processes
  WHERE modulo_id = v_modulo_id;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration 004 concluída com sucesso!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🧵 Módulo Costura ID: %', v_modulo_id;
  RAISE NOTICE '📋 Total de processos: %', v_total_processos;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

COMMIT;
