-- Migration: 003_add_peca_a_peca_tracking.sql
-- Implementa sistema de registro peça a peça no cronômetro

-- =====================================================
-- 1. CRIAR TABELA DE PEÇAS REGISTRADAS
-- =====================================================
CREATE TABLE IF NOT EXISTS pecas_registradas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  atividade_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  of_id UUID NOT NULL REFERENCES ofs(id),
  usuario_id UUID NOT NULL REFERENCES users(id),
  processo_id UUID NOT NULL REFERENCES processes(id),
  numero_peca INTEGER NOT NULL,
  timestamp_conclusao TIMESTAMP DEFAULT NOW(),
  tempo_decorrido INTEGER NOT NULL,  -- segundos desde início da atividade
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pecas_atividade ON pecas_registradas(atividade_id);
CREATE INDEX IF NOT EXISTS idx_pecas_of ON pecas_registradas(of_id);
CREATE INDEX IF NOT EXISTS idx_pecas_usuario ON pecas_registradas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pecas_processo ON pecas_registradas(processo_id);
CREATE INDEX IF NOT EXISTS idx_pecas_timestamp ON pecas_registradas(timestamp_conclusao);

-- Comentários
COMMENT ON TABLE pecas_registradas IS 'Registro individual de cada peça produzida com timestamp';
COMMENT ON COLUMN pecas_registradas.numero_peca IS 'Número sequencial da peça (1, 2, 3, ...)';
COMMENT ON COLUMN pecas_registradas.tempo_decorrido IS 'Segundos decorridos desde o início da atividade até conclusão desta peça';

-- =====================================================
-- 2. ADICIONAR CAMPOS NA TABELA ACTIVITIES
-- =====================================================
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS em_andamento BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS pecas_concluidas INTEGER DEFAULT 0;

-- Comentários
COMMENT ON COLUMN activities.em_andamento IS 'Indica se a atividade ainda está em andamento (true) ou foi finalizada (false)';
COMMENT ON COLUMN activities.pecas_concluidas IS 'Contador de peças já registradas individualmente';

-- =====================================================
-- 3. CRIAR VIEW PARA ANÁLISE DE TPU POR PEÇA
-- =====================================================
CREATE OR REPLACE VIEW v_tpu_por_peca AS
SELECT
  pr.id,
  pr.atividade_id,
  pr.of_id,
  pr.usuario_id,
  pr.processo_id,
  pr.numero_peca,
  pr.tempo_decorrido,
  pr.timestamp_conclusao,
  -- TPU individual: tempo desta peça - tempo da peça anterior
  CASE
    WHEN pr.numero_peca = 1 THEN pr.tempo_decorrido
    ELSE pr.tempo_decorrido - LAG(pr.tempo_decorrido) OVER (
      PARTITION BY pr.atividade_id
      ORDER BY pr.numero_peca
    )
  END AS tpu_individual_seg,
  u.nome AS usuario_nome,
  p.nome AS processo_nome,
  o.codigo AS of_codigo
FROM pecas_registradas pr
LEFT JOIN users u ON pr.usuario_id = u.id
LEFT JOIN processes p ON pr.processo_id = p.id
LEFT JOIN ofs o ON pr.of_id = o.id
ORDER BY pr.atividade_id, pr.numero_peca;

COMMENT ON VIEW v_tpu_por_peca IS 'Visualização com TPU calculado para cada peça individualmente';

-- =====================================================
-- 4. ATUALIZAR ATIVIDADES EXISTENTES
-- =====================================================
-- Marcar todas as atividades concluídas como em_andamento = false
UPDATE activities
SET em_andamento = false
WHERE status IN ('concluida', 'anomala');

-- Marcar atividades ativas/pausadas como em_andamento = true
UPDATE activities
SET em_andamento = true
WHERE status IN ('ativa', 'pausada');

-- Atualizar pecas_concluidas para atividades existentes (usando qty_realizada)
UPDATE activities
SET pecas_concluidas = COALESCE(qty_realizada, 0)
WHERE qty_realizada IS NOT NULL AND em_andamento = false;
