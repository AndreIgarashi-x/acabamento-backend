-- Adicionar campos referencia e descricao na tabela ofs
-- Migration: 002_add_referencia_descricao_to_ofs

ALTER TABLE ofs
ADD COLUMN IF NOT EXISTS referencia VARCHAR(10),
ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Adicionar comentários
COMMENT ON COLUMN ofs.referencia IS 'Código de referência do produto (ex: 02674)';
COMMENT ON COLUMN ofs.descricao IS 'Descrição do produto';

-- Criar índice para melhorar buscas por referência
CREATE INDEX IF NOT EXISTS idx_ofs_referencia ON ofs(referencia);
