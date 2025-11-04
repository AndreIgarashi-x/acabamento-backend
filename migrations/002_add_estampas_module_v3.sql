-- ==========================================================
-- MIGRATION 002: Adicionar Módulo de Estampas (v3 - CORRIGIDO)
-- Data: 2025-11-03
-- CORREÇÃO: Sem ON CONFLICT - verifica existência antes de inserir
-- ==========================================================

BEGIN;

-- ===========================
-- 1. TABELA: modulos
-- ===========================
CREATE TABLE IF NOT EXISTS modulos (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nome_exibicao VARCHAR(100) NOT NULL,
  icone VARCHAR(50),
  cor VARCHAR(20),
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  configuracoes JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO modulos (codigo, nome_exibicao, icone, cor, ordem) VALUES
('acabamento', 'Acabamento', 'scissors', '#10b981', 1),
('estampas', 'Estampas', 'printer', '#8b5cf6', 2)
ON CONFLICT (codigo) DO NOTHING;

-- ===========================
-- 2. TABELA: machines
-- ===========================
CREATE TABLE IF NOT EXISTS machines (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  modulo_id INTEGER REFERENCES modulos(id),
  num_cabecas INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'ativa',
  especificacoes JSONB,
  ultima_manutencao TIMESTAMP,
  proxima_manutencao TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

DO $$
DECLARE
  estampas_id INTEGER;
BEGIN
  SELECT id INTO estampas_id FROM modulos WHERE codigo = 'estampas';

  INSERT INTO machines (codigo, nome, tipo, modulo_id, num_cabecas) VALUES
  ('BORDADEIRA-01', 'Bordadeira Tajima 15 Cabeças - Máquina 1', 'bordado', estampas_id, 15),
  ('BORDADEIRA-02', 'Bordadeira Tajima 15 Cabeças - Máquina 2', 'bordado', estampas_id, 15),
  ('DTF-01', 'Impressora DTF', 'dtf', estampas_id, 1),
  ('PRENSA-01', 'Prensa de Patch', 'prensa', estampas_id, 1)
  ON CONFLICT (codigo) DO NOTHING;
END $$;

-- ===========================
-- 3. TABELA: machine_heads
-- ===========================
CREATE TABLE IF NOT EXISTS machine_heads (
  id SERIAL PRIMARY KEY,
  machine_id INTEGER REFERENCES machines(id) ON DELETE CASCADE,
  numero_cabeca INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'ok',
  ultimo_problema VARCHAR(100),
  ultima_manutencao TIMESTAMP,
  total_problemas INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(machine_id, numero_cabeca)
);

DO $$
DECLARE
  maq_id INTEGER;
BEGIN
  FOR maq_id IN SELECT id FROM machines WHERE tipo = 'bordado' LOOP
    FOR i IN 1..15 LOOP
      INSERT INTO machine_heads (machine_id, numero_cabeca)
      VALUES (maq_id, i)
      ON CONFLICT (machine_id, numero_cabeca) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ===========================
-- 4. TABELA: machine_problems
-- ===========================
CREATE TABLE IF NOT EXISTS machine_problems (
  id SERIAL PRIMARY KEY,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  machine_id INTEGER REFERENCES machines(id) ON DELETE CASCADE,
  machine_head_id INTEGER REFERENCES machine_heads(id) ON DELETE SET NULL,
  tipo_problema VARCHAR(50),
  descricao TEXT,
  tempo_parado_seg INTEGER DEFAULT 0,
  ts_inicio TIMESTAMP NOT NULL,
  ts_fim TIMESTAMP,
  resolvido_por UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- 5. MODIFICAR: processes
-- ===========================
ALTER TABLE processes ADD COLUMN IF NOT EXISTS modulo_id INTEGER REFERENCES modulos(id);
ALTER TABLE processes ADD COLUMN IF NOT EXISTS tipo_processo VARCHAR(50);
ALTER TABLE processes ADD COLUMN IF NOT EXISTS requer_maquina BOOLEAN DEFAULT false;
ALTER TABLE processes ADD COLUMN IF NOT EXISTS configuracoes JSONB;

-- Atualizar processos existentes para módulo Acabamento
UPDATE processes
SET modulo_id = (SELECT id FROM modulos WHERE codigo = 'acabamento')
WHERE modulo_id IS NULL;

-- ===========================
-- 6. MODIFICAR: activities
-- ===========================
ALTER TABLE activities ADD COLUMN IF NOT EXISTS machine_id INTEGER REFERENCES machines(id);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS cabecas_utilizadas INTEGER[];
ALTER TABLE activities ADD COLUMN IF NOT EXISTS percentual_eficiencia INTEGER;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS total_pausas_problema INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS tempo_pausas_problema_seg INTEGER DEFAULT 0;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS pausas_detalhadas JSONB;

-- ===========================
-- 7. MODIFICAR: users
-- ===========================
ALTER TABLE users ADD COLUMN IF NOT EXISTS modulos_permitidos TEXT[] DEFAULT ARRAY['acabamento'];

-- Atualizar usuários admin/gestor
UPDATE users
SET modulos_permitidos = ARRAY['acabamento', 'estampas']
WHERE perfil IN ('admin', 'gestor', 'Gestor', 'Admin', 'ADMIN', 'GESTOR');

-- ===========================
-- 8. VIEWS
-- ===========================
CREATE OR REPLACE VIEW v_eficiencia_bordado AS
SELECT
  m.codigo as maquina_codigo,
  m.nome as maquina_nome,
  a.id as activity_id,
  a.of_id,
  o.codigo as of_codigo,
  a.cabecas_utilizadas,
  ARRAY_LENGTH(a.cabecas_utilizadas, 1) as num_cabecas_usadas,
  m.num_cabecas as num_cabecas_total,
  CASE
    WHEN m.num_cabecas > 0 AND a.cabecas_utilizadas IS NOT NULL THEN
      ROUND((ARRAY_LENGTH(a.cabecas_utilizadas, 1)::DECIMAL / m.num_cabecas) * 100, 2)
    ELSE 0
  END as percentual_eficiencia,
  a.pecas_concluidas,
  a.tempo_total_seg,
  a.total_pausas_problema,
  a.tempo_pausas_problema_seg,
  a.ts_inicio,
  a.ts_fim
FROM activities a
JOIN machines m ON a.machine_id = m.id
LEFT JOIN ofs o ON a.of_id = o.id
WHERE m.tipo = 'bordado'
  AND a.status = 'finalizada'
ORDER BY a.ts_inicio DESC;

CREATE OR REPLACE VIEW v_problemas_por_cabeca AS
SELECT
  m.codigo as maquina_codigo,
  mh.numero_cabeca,
  mp.tipo_problema,
  COUNT(*) as total_problemas,
  SUM(mp.tempo_parado_seg) as tempo_total_parado_seg,
  ROUND(AVG(mp.tempo_parado_seg), 2) as tempo_medio_parado_seg
FROM machine_problems mp
JOIN machine_heads mh ON mp.machine_head_id = mh.id
JOIN machines m ON mh.machine_id = m.id
WHERE mp.tipo_problema IS NOT NULL
GROUP BY m.codigo, mh.numero_cabeca, mp.tipo_problema
ORDER BY total_problemas DESC;

-- ===========================
-- 9. ÍNDICES
-- ===========================
CREATE INDEX IF NOT EXISTS idx_machines_tipo ON machines(tipo);
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_modulo ON machines(modulo_id);
CREATE INDEX IF NOT EXISTS idx_machine_heads_status ON machine_heads(status);
CREATE INDEX IF NOT EXISTS idx_machine_heads_machine ON machine_heads(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_problems_tipo ON machine_problems(tipo_problema);
CREATE INDEX IF NOT EXISTS idx_machine_problems_machine ON machine_problems(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_problems_activity ON machine_problems(activity_id);
CREATE INDEX IF NOT EXISTS idx_activities_machine ON activities(machine_id);
CREATE INDEX IF NOT EXISTS idx_processes_modulo ON processes(modulo_id);

-- ===========================
-- 10. FUNÇÕES
-- ===========================
CREATE OR REPLACE FUNCTION calcular_eficiencia_bordado(
  p_cabecas_utilizadas INTEGER[],
  p_total_cabecas INTEGER
) RETURNS INTEGER AS $$
BEGIN
  IF p_cabecas_utilizadas IS NULL OR ARRAY_LENGTH(p_cabecas_utilizadas, 1) IS NULL OR p_total_cabecas = 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND((ARRAY_LENGTH(p_cabecas_utilizadas, 1)::DECIMAL / p_total_cabecas) * 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION atualizar_eficiencia_bordado()
RETURNS TRIGGER AS $$
DECLARE
  v_num_cabecas INTEGER;
BEGIN
  IF NEW.machine_id IS NOT NULL AND NEW.cabecas_utilizadas IS NOT NULL THEN
    SELECT num_cabecas INTO v_num_cabecas
    FROM machines
    WHERE id = NEW.machine_id;

    IF v_num_cabecas IS NOT NULL THEN
      NEW.percentual_eficiencia := calcular_eficiencia_bordado(NEW.cabecas_utilizadas, v_num_cabecas);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_atualizar_eficiencia_bordado ON activities;
CREATE TRIGGER trg_atualizar_eficiencia_bordado
  BEFORE INSERT OR UPDATE ON activities
  FOR EACH ROW
  WHEN (NEW.cabecas_utilizadas IS NOT NULL)
  EXECUTE FUNCTION atualizar_eficiencia_bordado();

-- ===========================
-- 11. SEEDS: Processos
-- ✅ CORRIGIDO: Verifica existência antes de inserir
-- ===========================
DO $$
DECLARE
  estampas_id INTEGER;
BEGIN
  SELECT id INTO estampas_id FROM modulos WHERE codigo = 'estampas';

  -- Inserir apenas se não existir
  IF NOT EXISTS (SELECT 1 FROM processes WHERE nome = 'Preparação de Bordado') THEN
    INSERT INTO processes (nome, modulo_id, tipo_processo, requer_maquina, ativo)
    VALUES ('Preparação de Bordado', estampas_id, 'preparacao', true, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM processes WHERE nome = 'Bordado') THEN
    INSERT INTO processes (nome, modulo_id, tipo_processo, requer_maquina, ativo)
    VALUES ('Bordado', estampas_id, 'maquina', true, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM processes WHERE nome = 'Aplicação de DTF') THEN
    INSERT INTO processes (nome, modulo_id, tipo_processo, requer_maquina, ativo)
    VALUES ('Aplicação de DTF', estampas_id, 'maquina', true, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM processes WHERE nome = 'Colagem de Patch') THEN
    INSERT INTO processes (nome, modulo_id, tipo_processo, requer_maquina, ativo)
    VALUES ('Colagem de Patch', estampas_id, 'maquina', true, true);
  END IF;
END $$;

-- ===========================
-- 12. VERIFICAÇÃO FINAL
-- ===========================
DO $$
DECLARE
  v_modulos INTEGER;
  v_machines INTEGER;
  v_heads INTEGER;
  v_processes INTEGER;
  v_activities_count INTEGER;
  v_users_updated INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_modulos FROM modulos;
  SELECT COUNT(*) INTO v_machines FROM machines;
  SELECT COUNT(*) INTO v_heads FROM machine_heads;
  SELECT COUNT(*) INTO v_processes FROM processes WHERE modulo_id = (SELECT id FROM modulos WHERE codigo = 'estampas');
  SELECT COUNT(*) INTO v_activities_count FROM activities;
  SELECT COUNT(*) INTO v_users_updated FROM users WHERE 'estampas' = ANY(modulos_permitidos);

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration 002 concluída com sucesso!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 Módulos criados: %', v_modulos;
  RAISE NOTICE '🤖 Máquinas criadas: %', v_machines;
  RAISE NOTICE '🔧 Cabeças criadas: %', v_heads;
  RAISE NOTICE '📦 Processos de estampas: %', v_processes;
  RAISE NOTICE '📋 Atividades preservadas: %', v_activities_count;
  RAISE NOTICE '👥 Usuários com acesso a Estampas: %', v_users_updated;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Próximo passo: Execute validate_migration.sql';
  RAISE NOTICE '';
  RAISE NOTICE '✅ TODAS AS CORREÇÕES APLICADAS:';
  RAISE NOTICE '   - activity_id: UUID';
  RAISE NOTICE '   - resolvido_por: UUID';
  RAISE NOTICE '   - Coluna: perfil (não papel)';
  RAISE NOTICE '   - Removido: campo descricao';
  RAISE NOTICE '   - INSERT processes: sem ON CONFLICT';
  RAISE NOTICE '';
END $$;

COMMIT;
