-- ==========================================================
-- CONCEDER ACESSO AO MÓDULO ESTAMPAS
-- Execute este script no Supabase SQL Editor
-- ==========================================================

-- Ver usuários atuais e suas permissões
SELECT
  id,
  nome,
  matricula,
  perfil,
  modulos_permitidos
FROM users
ORDER BY nome;

-- Dar acesso a TODOS os usuários admin e gestor
UPDATE users
SET modulos_permitidos = ARRAY['acabamento', 'estampas']
WHERE perfil IN ('admin', 'gestor', 'Admin', 'Gestor', 'ADMIN', 'GESTOR');

-- OU: Dar acesso a um usuário específico pela matrícula
-- UPDATE users
-- SET modulos_permitidos = ARRAY['acabamento', 'estampas']
-- WHERE matricula = 'ANDRE001';

-- Verificar resultado
SELECT
  id,
  nome,
  matricula,
  perfil,
  modulos_permitidos
FROM users
WHERE 'estampas' = ANY(modulos_permitidos)
ORDER BY nome;
