-- ==========================================================
-- MIGRATION 003: Adicionar módulo às OFs
-- Data: 2025-11-04
-- Descrição: Separar OFs por módulo (Acabamento vs Estampas)
-- ==========================================================

BEGIN;

-- ===========================
-- 1. ADICIONAR COLUNA modulo_id
-- ===========================
ALTER TABLE ofs ADD COLUMN IF NOT EXISTS modulo_id INTEGER REFERENCES modulos(id);

-- ===========================
-- 2. ATUALIZAR OFs EXISTENTES
-- Todas as OFs existentes são de Acabamento
-- ===========================
UPDATE ofs
SET modulo_id = (SELECT id FROM modulos WHERE codigo = 'acabamento')
WHERE modulo_id IS NULL;

-- ===========================
-- 3. ÍNDICE
-- ===========================
CREATE INDEX IF NOT EXISTS idx_ofs_modulo ON ofs(modulo_id);

-- ===========================
-- 4. VERIFICAÇÃO
-- ===========================
DO $$
DECLARE
  v_ofs_acabamento INTEGER;
  v_ofs_estampas INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_ofs_acabamento
  FROM ofs
  WHERE modulo_id = (SELECT id FROM modulos WHERE codigo = 'acabamento');

  SELECT COUNT(*) INTO v_ofs_estampas
  FROM ofs
  WHERE modulo_id = (SELECT id FROM modulos WHERE codigo = 'estampas');

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration 003 concluída com sucesso!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📦 OFs de Acabamento: %', v_ofs_acabamento;
  RAISE NOTICE '🖨️ OFs de Estampas: %', v_ofs_estampas;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

COMMIT;
