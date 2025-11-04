// =====================================================
// BORDADO.JS - Atividades de Bordado (Módulo Estampas)
// App Cronometragem - DCJ Uniformes
// =====================================================

const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middlewares/auth');
const { body, param, validationResult } = require('express-validator');

// Middleware de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// =====================================================
// POST /start - INICIAR ATIVIDADE DE BORDADO
// =====================================================
router.post('/start',
  authenticateToken,
  [
    body('user_id').isUUID().withMessage('user_id deve ser um UUID válido'),
    body('process_id').isUUID().withMessage('process_id deve ser um UUID válido'),
    body('of_id').isUUID().withMessage('of_id deve ser um UUID válido'),
    body('machine_id').isInt().withMessage('machine_id é obrigatório'),
    body('cabecas_utilizadas').isArray({ min: 1 }).withMessage('Selecione pelo menos 1 cabeça'),
    body('qty_planejada').isInt({ min: 1 }).withMessage('qty_planejada deve ser >= 1')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { user_id, process_id, of_id, machine_id, cabecas_utilizadas, qty_planejada } = req.body;

      console.log('🎯 INICIANDO BORDADO:', {
        user_id,
        machine_id,
        cabecas: cabecas_utilizadas
      });

      // 1. Verificar se usuário existe e está ativo
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, nome, ativo')
        .eq('id', user_id)
        .single();

      if (userError || !user || !user.ativo) {
        return res.status(403).json({
          success: false,
          message: 'Usuário não encontrado ou inativo'
        });
      }

      // 2. Verificar se máquina existe e está ativa
      const { data: machine, error: machineError } = await supabaseAdmin
        .from('machines')
        .select('id, nome, tipo, num_cabecas, status')
        .eq('id', machine_id)
        .single();

      if (machineError || !machine) {
        return res.status(404).json({
          success: false,
          message: 'Máquina não encontrada'
        });
      }

      if (machine.status !== 'ativa') {
        return res.status(400).json({
          success: false,
          message: `Máquina ${machine.nome} não está disponível (status: ${machine.status})`
        });
      }

      // 3. Validar cabeças selecionadas
      if (machine.tipo === 'bordado') {
        const invalidHeads = cabecas_utilizadas.filter(h => h < 1 || h > machine.num_cabecas);
        if (invalidHeads.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Cabeças inválidas: ${invalidHeads.join(', ')}. Máquina possui ${machine.num_cabecas} cabeças.`
          });
        }

        // Verificar se alguma cabeça está com problema
        const { data: problemHeads } = await supabaseAdmin
          .from('machine_heads')
          .select('numero_cabeca, status, ultimo_problema')
          .eq('machine_id', machine_id)
          .in('numero_cabeca', cabecas_utilizadas)
          .eq('status', 'problema');

        if (problemHeads && problemHeads.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Algumas cabeças selecionadas estão com problema',
            cabecas_com_problema: problemHeads
          });
        }
      }

      // 4. Verificar se já tem sessão ativa para este usuário
      const { data: activeSessions } = await supabaseAdmin
        .from('activities')
        .select('id, status')
        .eq('user_id', user_id)
        .in('status', ['ativa', 'pausada'])
        .eq('em_andamento', true);

      if (activeSessions && activeSessions.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma sessão ativa para este usuário',
          active_session_id: activeSessions[0].id
        });
      }

      // 5. Verificar processo e OF (mesma lógica do activities.js)
      const { data: process } = await supabaseAdmin
        .from('processes')
        .select('id, nome, ativo')
        .eq('id', process_id)
        .single();

      if (!process || !process.ativo) {
        return res.status(404).json({
          success: false,
          message: 'Processo não encontrado ou inativo'
        });
      }

      const { data: of } = await supabaseAdmin
        .from('ofs')
        .select('id, codigo, status')
        .eq('id', of_id)
        .single();

      if (!of || (of.status !== 'aberta' && of.status !== 'em_andamento')) {
        return res.status(404).json({
          success: false,
          message: 'OF não encontrada ou indisponível'
        });
      }

      // 6. Calcular eficiência inicial
      const percentual_eficiencia = Math.round((cabecas_utilizadas.length / machine.num_cabecas) * 100);

      // 7. Criar atividade de bordado
      const { data: activity, error: createError } = await supabaseAdmin
        .from('activities')
        .insert({
          user_id,
          process_id,
          of_id,
          machine_id,
          qty_planejada,
          cabecas_utilizadas,
          percentual_eficiencia,
          status: 'ativa',
          em_andamento: true,
          pecas_concluidas: 0,
          total_pausas_problema: 0,
          tempo_pausas_problema_seg: 0,
          pausas_detalhadas: [],
          ts_inicio: new Date().toISOString()
        })
        .select(`
          *,
          users(nome),
          processes(nome),
          ofs(codigo, quantidade),
          machines:machine_id(nome, tipo, num_cabecas)
        `)
        .single();

      if (createError) {
        console.error('❌ Erro ao criar atividade:', createError);
        throw createError;
      }

      // 8. Atualizar OF para em_andamento
      await supabaseAdmin
        .from('ofs')
        .update({ status: 'em_andamento' })
        .eq('id', of_id);

      console.log('✅ Bordado iniciado:', activity.id);

      res.status(201).json({
        success: true,
        message: 'Bordado iniciado com sucesso',
        data: activity
      });
    } catch (error) {
      console.error('❌ Erro ao iniciar bordado:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao iniciar bordado',
        error: error.message
      });
    }
  }
);

// =====================================================
// POST /:activity_id/problema - REGISTRAR PROBLEMA
// =====================================================
router.post('/:activity_id/problema',
  authenticateToken,
  [
    param('activity_id').isUUID(),
    body('machine_head_id').isInt().withMessage('ID da cabeça é obrigatório'),
    body('tipo_problema').notEmpty().withMessage('Tipo do problema é obrigatório'),
    body('descricao').optional().isString()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { activity_id } = req.params;
      const { machine_head_id, tipo_problema, descricao } = req.body;
      const ts_inicio = new Date().toISOString();

      // 1. Buscar atividade
      const { data: activity, error: actError } = await supabaseAdmin
        .from('activities')
        .select('*, machines:machine_id(id, nome)')
        .eq('id', activity_id)
        .single();

      if (actError || !activity) {
        return res.status(404).json({
          success: false,
          message: 'Atividade não encontrada'
        });
      }

      // 2. Registrar problema
      const { data: problem, error: problemError } = await supabaseAdmin
        .from('machine_problems')
        .insert({
          activity_id,
          machine_id: activity.machine_id,
          machine_head_id,
          tipo_problema,
          descricao,
          ts_inicio,
          tempo_parado_seg: 0  // Será calculado ao resolver
        })
        .select()
        .single();

      if (problemError) throw problemError;

      // 3. Atualizar status da cabeça
      await supabaseAdmin
        .from('machine_heads')
        .update({
          status: 'problema',
          ultimo_problema: tipo_problema
        })
        .eq('id', machine_head_id);

      // 4. Adicionar pausa detalhada na atividade
      const pausas = activity.pausas_detalhadas || [];
      pausas.push({
        ts_inicio,
        motivo: tipo_problema,
        cabeca: machine_head_id,
        descricao,
        problem_id: problem.id
      });

      await supabaseAdmin
        .from('activities')
        .update({
          pausas_detalhadas: pausas,
          total_pausas_problema: (activity.total_pausas_problema || 0) + 1
        })
        .eq('id', activity_id);

      res.status(201).json({
        success: true,
        message: 'Problema registrado',
        data: problem
      });
    } catch (error) {
      console.error('❌ Erro ao registrar problema:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao registrar problema',
        error: error.message
      });
    }
  }
);

// =====================================================
// PUT /problema/:problem_id/resolver - RESOLVER PROBLEMA
// =====================================================
router.put('/problema/:problem_id/resolver',
  authenticateToken,
  [
    param('problem_id').isInt(),
    body('resolvido_por').isUUID().withMessage('ID do usuário é obrigatório')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { problem_id } = req.params;
      const { resolvido_por } = req.body;
      const ts_fim = new Date().toISOString();

      // 1. Buscar problema
      const { data: problem, error: findError } = await supabaseAdmin
        .from('machine_problems')
        .select('*, machine_heads(id, machine_id, numero_cabeca)')
        .eq('id', problem_id)
        .single();

      if (findError || !problem) {
        return res.status(404).json({
          success: false,
          message: 'Problema não encontrado'
        });
      }

      if (problem.ts_fim) {
        return res.status(400).json({
          success: false,
          message: 'Problema já foi resolvido'
        });
      }

      // 2. Calcular tempo parado
      const tempo_parado_seg = Math.floor(
        (new Date(ts_fim) - new Date(problem.ts_inicio)) / 1000
      );

      // 3. Atualizar problema
      const { error: updateError } = await supabaseAdmin
        .from('machine_problems')
        .update({
          ts_fim,
          tempo_parado_seg,
          resolvido_por
        })
        .eq('id', problem_id);

      if (updateError) throw updateError;

      // 4. Atualizar cabeça (voltar para status ok)
      await supabaseAdmin
        .from('machine_heads')
        .update({
          status: 'ok',
          ultima_manutencao: ts_fim
        })
        .eq('id', problem.machine_head_id);

      // 5. Atualizar atividade com tempo de pausa
      if (problem.activity_id) {
        const { data: activity } = await supabaseAdmin
          .from('activities')
          .select('tempo_pausas_problema_seg, pausas_detalhadas')
          .eq('id', problem.activity_id)
          .single();

        if (activity) {
          const pausas = activity.pausas_detalhadas || [];
          const pausaIndex = pausas.findIndex(p => p.problem_id === problem_id);

          if (pausaIndex >= 0) {
            pausas[pausaIndex].ts_fim = ts_fim;
            pausas[pausaIndex].duracao_seg = tempo_parado_seg;
          }

          await supabaseAdmin
            .from('activities')
            .update({
              tempo_pausas_problema_seg: (activity.tempo_pausas_problema_seg || 0) + tempo_parado_seg,
              pausas_detalhadas: pausas
            })
            .eq('id', problem.activity_id);
        }
      }

      res.json({
        success: true,
        message: 'Problema resolvido',
        tempo_parado_seg
      });
    } catch (error) {
      console.error('❌ Erro ao resolver problema:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao resolver problema',
        error: error.message
      });
    }
  }
);

// =====================================================
// PUT /:activity_id/cabecas - ATUALIZAR CABEÇAS EM USO
// =====================================================
router.put('/:activity_id/cabecas',
  authenticateToken,
  [
    param('activity_id').isUUID(),
    body('cabecas_utilizadas').isArray({ min: 1 })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { activity_id } = req.params;
      const { cabecas_utilizadas } = req.body;

      // Buscar atividade e máquina
      const { data: activity, error: actError } = await supabaseAdmin
        .from('activities')
        .select('*, machines:machine_id(num_cabecas)')
        .eq('id', activity_id)
        .single();

      if (actError || !activity) {
        return res.status(404).json({
          success: false,
          message: 'Atividade não encontrada'
        });
      }

      if (activity.status !== 'ativa') {
        return res.status(400).json({
          success: false,
          message: 'Apenas atividades ativas podem ter cabeças alteradas'
        });
      }

      // Recalcular eficiência
      const num_cabecas = activity.machines?.num_cabecas || 1;
      const percentual_eficiencia = Math.round((cabecas_utilizadas.length / num_cabecas) * 100);

      // Atualizar
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('activities')
        .update({
          cabecas_utilizadas,
          percentual_eficiencia
        })
        .eq('id', activity_id)
        .select()
        .single();

      if (updateError) throw updateError;

      res.json({
        success: true,
        message: 'Cabeças atualizadas',
        data: updated
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar cabeças:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar cabeças',
        error: error.message
      });
    }
  }
);

module.exports = router;
