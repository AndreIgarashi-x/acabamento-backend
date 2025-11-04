// =====================================================
// ESTAMPAS-REPORTS.JS - Relatórios do Módulo Estampas
// App Cronometragem - DCJ Uniformes
// =====================================================

const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middlewares/auth');
const { query, validationResult } = require('express-validator');

// Middleware de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// =====================================================
// GET /eficiencia-bordado - RELATÓRIO DE EFICIÊNCIA
// =====================================================
router.get('/eficiencia-bordado',
  authenticateToken,
  [
    query('machine_id').optional().isInt(),
    query('data_inicio').optional().isISO8601(),
    query('data_fim').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 500 })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { machine_id, data_inicio, data_fim, limit = 100 } = req.query;

      let query = supabaseAdmin
        .from('v_eficiencia_bordado')
        .select('*')
        .limit(limit);

      if (machine_id) {
        // Buscar código da máquina
        const { data: machine } = await supabaseAdmin
          .from('machines')
          .select('codigo')
          .eq('id', machine_id)
          .single();

        if (machine) {
          query = query.eq('maquina_codigo', machine.codigo);
        }
      }

      if (data_inicio) {
        query = query.gte('ts_inicio', data_inicio);
      }

      if (data_fim) {
        query = query.lte('ts_fim', data_fim);
      }

      const { data: eficiencia, error } = await query;

      if (error) throw error;

      // Calcular estatísticas gerais
      const stats = {
        total_atividades: eficiencia.length,
        eficiencia_media: eficiencia.length > 0
          ? Math.round(eficiencia.reduce((sum, e) => sum + (e.percentual_eficiencia || 0), 0) / eficiencia.length)
          : 0,
        total_pecas: eficiencia.reduce((sum, e) => sum + (e.pecas_concluidas || 0), 0),
        tempo_total_seg: eficiencia.reduce((sum, e) => sum + (e.tempo_total_seg || 0), 0),
        tempo_pausas_seg: eficiencia.reduce((sum, e) => sum + (e.tempo_pausas_problema_seg || 0), 0)
      };

      res.json({
        success: true,
        data: eficiencia,
        stats
      });
    } catch (error) {
      console.error('❌ Erro ao buscar eficiência:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar relatório de eficiência',
        error: error.message
      });
    }
  }
);

// =====================================================
// GET /problemas-por-cabeca - RELATÓRIO DE PROBLEMAS
// =====================================================
router.get('/problemas-por-cabeca',
  authenticateToken,
  [
    query('machine_id').optional().isInt(),
    query('tipo_problema').optional().isString()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { machine_id, tipo_problema } = req.query;

      let query = supabaseAdmin
        .from('v_problemas_por_cabeca')
        .select('*')
        .order('total_problemas', { ascending: false });

      if (machine_id) {
        // Buscar código da máquina
        const { data: machine } = await supabaseAdmin
          .from('machines')
          .select('codigo')
          .eq('id', machine_id)
          .single();

        if (machine) {
          query = query.eq('maquina_codigo', machine.codigo);
        }
      }

      if (tipo_problema) {
        query = query.eq('tipo_problema', tipo_problema);
      }

      const { data: problemas, error } = await query;

      if (error) throw error;

      // Estatísticas
      const stats = {
        total_problemas: problemas.reduce((sum, p) => sum + (p.total_problemas || 0), 0),
        tempo_total_parado_horas: problemas.reduce((sum, p) => sum + (p.tempo_total_parado_seg || 0), 0) / 3600,
        cabecas_afetadas: problemas.length
      };

      // Agrupar por tipo de problema
      const por_tipo = problemas.reduce((acc, p) => {
        const tipo = p.tipo_problema || 'Não especificado';
        if (!acc[tipo]) {
          acc[tipo] = {
            tipo_problema: tipo,
            total_ocorrencias: 0,
            tempo_total_seg: 0
          };
        }
        acc[tipo].total_ocorrencias += p.total_problemas || 0;
        acc[tipo].tempo_total_seg += p.tempo_total_parado_seg || 0;
        return acc;
      }, {});

      res.json({
        success: true,
        data: problemas,
        stats,
        por_tipo: Object.values(por_tipo)
      });
    } catch (error) {
      console.error('❌ Erro ao buscar problemas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar relatório de problemas',
        error: error.message
      });
    }
  }
);

// =====================================================
// GET /problemas - LISTAR TODOS OS PROBLEMAS
// =====================================================
router.get('/problemas',
  authenticateToken,
  [
    query('machine_id').optional().isInt(),
    query('activity_id').optional().isUUID(),
    query('resolvido').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 500 })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { machine_id, activity_id, resolvido, limit = 100 } = req.query;

      let query = supabaseAdmin
        .from('machine_problems')
        .select(`
          *,
          machines(codigo, nome),
          machine_heads(numero_cabeca),
          activities(id, of_id, ofs(codigo)),
          users:resolvido_por(nome)
        `)
        .order('ts_inicio', { ascending: false })
        .limit(limit);

      if (machine_id) {
        query = query.eq('machine_id', machine_id);
      }

      if (activity_id) {
        query = query.eq('activity_id', activity_id);
      }

      if (resolvido !== undefined) {
        if (resolvido === true || resolvido === 'true') {
          query = query.not('ts_fim', 'is', null);
        } else {
          query = query.is('ts_fim', null);
        }
      }

      const { data: problemas, error } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data: problemas,
        count: problemas.length
      });
    } catch (error) {
      console.error('❌ Erro ao listar problemas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar problemas',
        error: error.message
      });
    }
  }
);

// =====================================================
// GET /dashboard - DASHBOARD DO MÓDULO ESTAMPAS
// =====================================================
router.get('/dashboard',
  authenticateToken,
  async (req, res) => {
    try {
      // 1. Máquinas ativas
      const { data: machines } = await supabaseAdmin
        .from('machines')
        .select(`
          id,
          codigo,
          nome,
          tipo,
          status,
          num_cabecas,
          machine_heads(id, numero_cabeca, status)
        `)
        .eq('status', 'ativa');

      // 2. Atividades em andamento
      const { data: activities } = await supabaseAdmin
        .from('activities')
        .select(`
          id,
          status,
          pecas_concluidas,
          qty_planejada,
          ts_inicio,
          cabecas_utilizadas,
          percentual_eficiencia,
          users(nome),
          processes(nome),
          ofs(codigo),
          machines:machine_id(codigo, nome)
        `)
        .not('machine_id', 'is', null)
        .in('status', ['ativa', 'pausada'])
        .eq('em_andamento', true);

      // 3. Problemas não resolvidos
      const { data: problemasAbertos } = await supabaseAdmin
        .from('machine_problems')
        .select(`
          id,
          tipo_problema,
          descricao,
          ts_inicio,
          machines(codigo, nome),
          machine_heads(numero_cabeca)
        `)
        .is('ts_fim', null);

      // 4. Estatísticas do dia
      const hoje = new Date().toISOString().split('T')[0];

      const { data: statsHoje } = await supabaseAdmin
        .from('activities')
        .select('pecas_concluidas, tempo_total_seg, percentual_eficiencia')
        .not('machine_id', 'is', null)
        .eq('status', 'finalizada')
        .gte('ts_inicio', hoje);

      const stats_dia = {
        pecas_concluidas: statsHoje?.reduce((sum, a) => sum + (a.pecas_concluidas || 0), 0) || 0,
        tempo_producao_horas: (statsHoje?.reduce((sum, a) => sum + (a.tempo_total_seg || 0), 0) || 0) / 3600,
        eficiencia_media: statsHoje && statsHoje.length > 0
          ? Math.round(statsHoje.reduce((sum, a) => sum + (a.percentual_eficiencia || 0), 0) / statsHoje.length)
          : 0
      };

      res.json({
        success: true,
        data: {
          machines,
          activities,
          problemas_abertos: problemasAbertos,
          stats_dia
        }
      });
    } catch (error) {
      console.error('❌ Erro ao buscar dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar dashboard',
        error: error.message
      });
    }
  }
);

// =====================================================
// GET /tipos-problema - LISTAR TIPOS DE PROBLEMAS
// =====================================================
router.get('/tipos-problema',
  authenticateToken,
  async (req, res) => {
    try {
      const { data: tipos, error } = await supabaseAdmin
        .from('machine_problems')
        .select('tipo_problema')
        .not('tipo_problema', 'is', null);

      if (error) throw error;

      // Obter valores únicos e contar ocorrências
      const uniqueTipos = [...new Set(tipos.map(t => t.tipo_problema))];
      const tiposComContagem = uniqueTipos.map(tipo => ({
        tipo,
        total: tipos.filter(t => t.tipo_problema === tipo).length
      })).sort((a, b) => b.total - a.total);

      res.json({
        success: true,
        data: tiposComContagem
      });
    } catch (error) {
      console.error('❌ Erro ao listar tipos de problema:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar tipos de problema',
        error: error.message
      });
    }
  }
);

module.exports = router;
