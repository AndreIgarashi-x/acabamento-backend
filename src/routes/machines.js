// =====================================================
// MACHINES.JS - Gestão de Máquinas (Módulo Estampas)
// App Cronometragem - DCJ Uniformes
// =====================================================

const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middlewares/auth');
const { body, param, query, validationResult } = require('express-validator');

// Middleware de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// =====================================================
// GET / - LISTAR MÁQUINAS
// =====================================================
router.get('/',
  authenticateToken,
  [
    query('modulo_id').optional().isInt(),
    query('tipo').optional().isString(),
    query('status').optional().isIn(['ativa', 'inativa', 'manutencao'])
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { modulo_id, tipo, status } = req.query;

      let query = supabaseAdmin
        .from('machines')
        .select(`
          *,
          modulos(codigo, nome_exibicao),
          machine_heads(count)
        `)
        .order('nome', { ascending: true });

      if (modulo_id) {
        query = query.eq('modulo_id', modulo_id);
      }

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: machines, error } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data: machines,
        count: machines.length
      });
    } catch (error) {
      console.error('❌ Erro ao listar máquinas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar máquinas',
        error: error.message
      });
    }
  }
);

// =====================================================
// GET /:id - OBTER MÁQUINA POR ID
// =====================================================
router.get('/:id',
  authenticateToken,
  [
    param('id').isInt().withMessage('ID deve ser um número inteiro')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      const { data: machine, error } = await supabaseAdmin
        .from('machines')
        .select(`
          *,
          modulos(codigo, nome_exibicao),
          machine_heads(
            id,
            numero_cabeca,
            status,
            ultimo_problema,
            total_problemas
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Máquina não encontrada'
          });
        }
        throw error;
      }

      res.json({
        success: true,
        data: machine
      });
    } catch (error) {
      console.error('❌ Erro ao buscar máquina:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar máquina',
        error: error.message
      });
    }
  }
);

// =====================================================
// POST / - CRIAR NOVA MÁQUINA
// =====================================================
router.post('/',
  authenticateToken,
  [
    body('codigo').notEmpty().withMessage('Código é obrigatório'),
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('tipo').isIn(['bordado', 'dtf', 'prensa']).withMessage('Tipo inválido'),
    body('modulo_id').isInt().withMessage('Módulo ID é obrigatório'),
    body('num_cabecas').isInt({ min: 1 }).withMessage('Número de cabeças deve ser >= 1')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { codigo, nome, tipo, modulo_id, num_cabecas, especificacoes } = req.body;

      // Verificar se código já existe
      const { data: existing } = await supabaseAdmin
        .from('machines')
        .select('id')
        .eq('codigo', codigo)
        .single();

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma máquina com este código'
        });
      }

      // Criar máquina
      const { data: machine, error } = await supabaseAdmin
        .from('machines')
        .insert({
          codigo,
          nome,
          tipo,
          modulo_id,
          num_cabecas,
          especificacoes,
          status: 'ativa'
        })
        .select()
        .single();

      if (error) throw error;

      // Se for máquina de bordado, criar as cabeças
      if (tipo === 'bordado' && num_cabecas > 1) {
        const heads = [];
        for (let i = 1; i <= num_cabecas; i++) {
          heads.push({
            machine_id: machine.id,
            numero_cabeca: i,
            status: 'ok'
          });
        }

        const { error: headsError } = await supabaseAdmin
          .from('machine_heads')
          .insert(heads);

        if (headsError) {
          console.error('❌ Erro ao criar cabeças:', headsError);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Máquina criada com sucesso',
        data: machine
      });
    } catch (error) {
      console.error('❌ Erro ao criar máquina:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar máquina',
        error: error.message
      });
    }
  }
);

// =====================================================
// PUT /:id - ATUALIZAR MÁQUINA
// =====================================================
router.put('/:id',
  authenticateToken,
  [
    param('id').isInt(),
    body('nome').optional().notEmpty(),
    body('status').optional().isIn(['ativa', 'inativa', 'manutencao']),
    body('especificacoes').optional().isObject()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, status, especificacoes, ultima_manutencao, proxima_manutencao } = req.body;

      const updateData = {};
      if (nome) updateData.nome = nome;
      if (status) updateData.status = status;
      if (especificacoes) updateData.especificacoes = especificacoes;
      if (ultima_manutencao) updateData.ultima_manutencao = ultima_manutencao;
      if (proxima_manutencao) updateData.proxima_manutencao = proxima_manutencao;
      updateData.updated_at = new Date().toISOString();

      const { data: machine, error } = await supabaseAdmin
        .from('machines')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Máquina não encontrada'
          });
        }
        throw error;
      }

      res.json({
        success: true,
        message: 'Máquina atualizada com sucesso',
        data: machine
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar máquina:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar máquina',
        error: error.message
      });
    }
  }
);

// =====================================================
// DELETE /:id - DELETAR MÁQUINA
// =====================================================
router.delete('/:id',
  authenticateToken,
  [
    param('id').isInt()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar se há atividades vinculadas
      const { data: activities, error: actError } = await supabaseAdmin
        .from('activities')
        .select('id')
        .eq('machine_id', id)
        .limit(1);

      if (actError) throw actError;

      if (activities && activities.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível deletar máquina com atividades vinculadas'
        });
      }

      const { error } = await supabaseAdmin
        .from('machines')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Máquina deletada com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao deletar máquina:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao deletar máquina',
        error: error.message
      });
    }
  }
);

// =====================================================
// GET /:id/heads - LISTAR CABEÇAS DA MÁQUINA
// =====================================================
router.get('/:id/heads',
  authenticateToken,
  [
    param('id').isInt()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      const { data: heads, error } = await supabaseAdmin
        .from('machine_heads')
        .select('*')
        .eq('machine_id', id)
        .order('numero_cabeca', { ascending: true });

      if (error) throw error;

      res.json({
        success: true,
        data: heads,
        count: heads.length
      });
    } catch (error) {
      console.error('❌ Erro ao listar cabeças:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar cabeças',
        error: error.message
      });
    }
  }
);

// =====================================================
// PUT /:id/heads/:head_id - ATUALIZAR STATUS DE CABEÇA
// =====================================================
router.put('/:id/heads/:head_id',
  authenticateToken,
  [
    param('id').isInt(),
    param('head_id').isInt(),
    body('status').isIn(['ok', 'problema', 'manutencao']).withMessage('Status inválido')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id, head_id } = req.params;
      const { status, ultimo_problema } = req.body;

      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (ultimo_problema) {
        updateData.ultimo_problema = ultimo_problema;
      }

      // Se mudou para 'problema', incrementar contador
      if (status === 'problema') {
        const { data: head } = await supabaseAdmin
          .from('machine_heads')
          .select('total_problemas')
          .eq('id', head_id)
          .single();

        if (head) {
          updateData.total_problemas = (head.total_problemas || 0) + 1;
        }
      }

      const { data: updatedHead, error } = await supabaseAdmin
        .from('machine_heads')
        .update(updateData)
        .eq('id', head_id)
        .eq('machine_id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Cabeça não encontrada'
          });
        }
        throw error;
      }

      res.json({
        success: true,
        message: 'Cabeça atualizada com sucesso',
        data: updatedHead
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar cabeça:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar cabeça',
        error: error.message
      });
    }
  }
);

module.exports = router;
