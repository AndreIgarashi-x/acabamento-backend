-- =====================================================
-- ADICIONAR NOVOS PROCESSOS AO SISTEMA
-- =====================================================
--
-- Este script adiciona os novos processos solicitados
-- à tabela processes do sistema
--
-- PROCESSOS A ADICIONAR:
-- 1. Limpeza e revisão
-- 2. Limpeza com sugador (sem revisão)
-- 3. Revisão (sem limpeza)
-- 4. Travete
-- 5. Pregar botões de pressão
-- 6. Marcação de botão
-- 7. Marcação de caseado
-- 8. Dobragem
-- 9. Etiquetagem
--
-- =====================================================

-- Mensagem inicial
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔄 ADICIONANDO NOVOS PROCESSOS...';
  RAISE NOTICE 'Data/Hora: %', NOW();
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 1. VERIFICAR PROCESSOS EXISTENTES
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '📋 PROCESSOS ATUAIS NO SISTEMA:';
  RAISE NOTICE '==============================';
END $$;

SELECT
  id,
  nome,
  CASE WHEN ativo THEN '✅ Ativo' ELSE '❌ Inativo' END AS status
FROM processes
ORDER BY nome;

-- =====================================================
-- 2. INSERIR NOVOS PROCESSOS
-- =====================================================

-- Nota: Se o processo já existir, este script vai dar erro
-- Para evitar duplicatas, vamos usar INSERT apenas se não existir

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '➕ INSERINDO NOVOS PROCESSOS...';
  RAISE NOTICE '';
END $$;

-- 1. Limpeza e revisão
INSERT INTO processes (nome, ativo)
SELECT 'Limpeza e revisão', true
WHERE NOT EXISTS (
  SELECT 1 FROM processes WHERE nome = 'Limpeza e revisão'
);

-- 2. Limpeza com sugador (sem revisão)
INSERT INTO processes (nome, ativo)
SELECT 'Limpeza com sugador (sem revisão)', true
WHERE NOT EXISTS (
  SELECT 1 FROM processes WHERE nome = 'Limpeza com sugador (sem revisão)'
);

-- 3. Revisão (sem limpeza)
INSERT INTO processes (nome, ativo)
SELECT 'Revisão (sem limpeza)', true
WHERE NOT EXISTS (
  SELECT 1 FROM processes WHERE nome = 'Revisão (sem limpeza)'
);

-- 4. Travete
INSERT INTO processes (nome, ativo)
SELECT 'Travete', true
WHERE NOT EXISTS (
  SELECT 1 FROM processes WHERE nome = 'Travete'
);

-- 5. Pregar botões de pressão
INSERT INTO processes (nome, ativo)
SELECT 'Pregar botões de pressão', true
WHERE NOT EXISTS (
  SELECT 1 FROM processes WHERE nome = 'Pregar botões de pressão'
);

-- 6. Marcação de botão
INSERT INTO processes (nome, ativo)
SELECT 'Marcação de botão', true
WHERE NOT EXISTS (
  SELECT 1 FROM processes WHERE nome = 'Marcação de botão'
);

-- 7. Marcação de caseado
INSERT INTO processes (nome, ativo)
SELECT 'Marcação de caseado', true
WHERE NOT EXISTS (
  SELECT 1 FROM processes WHERE nome = 'Marcação de caseado'
);

-- 8. Dobragem
INSERT INTO processes (nome, ativo)
SELECT 'Dobragem', true
WHERE NOT EXISTS (
  SELECT 1 FROM processes WHERE nome = 'Dobragem'
);

-- 9. Etiquetagem
INSERT INTO processes (nome, ativo)
SELECT 'Etiquetagem', true
WHERE NOT EXISTS (
  SELECT 1 FROM processes WHERE nome = 'Etiquetagem'
);

-- =====================================================
-- 3. VERIFICAR INSERÇÃO
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ PROCESSOS INSERIDOS!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 TODOS OS PROCESSOS NO SISTEMA:';
  RAISE NOTICE '=================================';
END $$;

SELECT
  ROW_NUMBER() OVER (ORDER BY nome) AS "#",
  nome,
  CASE WHEN ativo THEN '✅ Ativo' ELSE '❌ Inativo' END AS status,
  id
FROM processes
ORDER BY nome;

-- Contar total
DO $$
DECLARE
  total_processos INTEGER;
  novos_processos INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_processos FROM processes;

  RAISE NOTICE '';
  RAISE NOTICE '📊 TOTAL DE PROCESSOS: %', total_processos;
  RAISE NOTICE '';
  RAISE NOTICE '✅ SCRIPT CONCLUÍDO!';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Próximo passo:';
  RAISE NOTICE '  - Os processos já aparecem no Timer automaticamente';
  RAISE NOTICE '  - Usuários podem selecionar ao iniciar atividades';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- MENSAGEM FINAL
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ PROCESSOS ADICIONADOS COM SUCESSO!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Processos disponíveis:';
  RAISE NOTICE '  1. Limpeza e revisão';
  RAISE NOTICE '  2. Limpeza com sugador (sem revisão)';
  RAISE NOTICE '  3. Revisão (sem limpeza)';
  RAISE NOTICE '  4. Travete';
  RAISE NOTICE '  5. Pregar botões de pressão';
  RAISE NOTICE '  6. Marcação de botão';
  RAISE NOTICE '  7. Marcação de caseado';
  RAISE NOTICE '  8. Dobragem';
  RAISE NOTICE '  9. Etiquetagem';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Os processos já aparecem automaticamente no Timer!';
  RAISE NOTICE '';
END $$;
