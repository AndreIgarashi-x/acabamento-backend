/**
 * ARQUIVO DE REFERÊNCIA: Activities com suporte a registro peça a peça
 *
 * INSTRUÇÕES DE USO:
 * 1. Execute a migration: backend/migrations/003_add_peca_a_peca_tracking.sql
 * 2. Substitua o conteúdo de activities.js por este arquivo
 * 3. Ou copie apenas os novos endpoints (registrar-peca e pecas) para o arquivo atual
 */

const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middlewares/auth');
const { body, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate limiter específico para start (10 req/minuto)
const startLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,
  message: { success: false, message: 'Muitas tentativas. Aguarde um momento.' }
});

// Middleware de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// =====================================================
// POST /start - INICIAR ATIVIDADE (com suporte a peça a peça)
// =====================================================
router.post('/start',
  authenticateToken,
  startLimiter,
  [
    body('user_id').isUUID().withMessage('user_id deve ser um UUID válido'),
    body('process_id').isUUID().withMessage('process_id deve ser um UUID válido'),
    body('of_id').isUUID().withMessage('of_id deve ser um UUID válido'),
    body('qty_planejada').isInt({ min: 1 }).withMessage('qty_planejada deve ser >= 1'),
    body('device_id').optional().isString()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { user_id, process_id, of_id, qty_planejada, device_id } = req.body;

      console.log('🎯 INICIANDO ATIVIDADE - OF ID:', of_id);

      // 1. Verificar se usuário existe e está ativo
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, nome, ativo')
        .eq('id', user_id)
        .single();

      if (userError || !user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      if (!user.ativo) {
        return res.status(403).json({
          success: false,
          message: 'Usuário inativo'
        });
      }

      // 2. Verificar se já tem sessão ativa para este usuário
      console.log('=' .repeat(60));
      console.log('🔍 VERIFICANDO SESSÃO ATIVA');
      console.log('Usuario ID:', user_id);

      const { data: activeSessions, error: activeError } = await supabaseAdmin
        .from('activities')
        .select('id, status, em_andamento, ts_inicio, ts_fim')
        .eq('user_id', user_id)
        .in('status', ['ativa', 'pausada'])
        .eq('em_andamento', true);

      console.log('Query executada:', {
        tabela: 'activities',
        filtros: { user_id, status: ['ativa', 'pausada'], em_andamento: true }
      });
      console.log('Resultado:', activeSessions?.length || 0, 'sessões encontradas');

      if (activeSessions && activeSessions.length > 0) {
        console.log('❌ SESSÕES ATIVAS ENCONTRADAS:', JSON.stringify(activeSessions, null, 2));
      }
      console.log('=' .repeat(60));

      if (activeError) {
        console.error('❌ Erro na query de verificação:', activeError);
        throw activeError;
      }

      if (activeSessions && activeSessions.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma sessão ativa para este usuário. Finalize ou pause antes de iniciar uma nova.',
          active_session_id: activeSessions[0].id,
          debug: {
            sessoes_encontradas: activeSessions.length,
            detalhes: activeSessions[0]
          }
        });
      }

      // 3. Verificar se processo existe e está ativo
      const { data: process, error: processError } = await supabaseAdmin
        .from('processes')
        .select('id, nome, ativo')
        .eq('id', process_id)
        .single();

      if (processError || !process) {
        return res.status(404).json({
          success: false,
          message: 'Processo não encontrado'
        });
      }

      if (!process.ativo) {
        return res.status(403).json({
          success: false,
          message: 'Processo inativo'
        });
      }

      // 4. Verificar se OF existe e está aberta
      const { data: of, error: ofError } = await supabaseAdmin
        .from('ofs')
        .select('id, codigo, quantidade, status')
        .eq('id', of_id)
        .single();

      if (ofError || !of) {
        return res.status(404).json({
          success: false,
          message: 'OF não encontrada'
        });
      }

      if (of.status !== 'aberta' && of.status !== 'em_andamento') {
        return res.status(400).json({
          success: false,
          message: `OF ${of.codigo} não está disponível (status: ${of.status})`
        });
      }

      // 5. Criar a atividade com novos campos para tracking peça a peça
      const { data: activity, error: createError } = await supabaseAdmin
        .from('activities')
        .insert({
          user_id,
          process_id,
          of_id,
          qty_planejada,
          status: 'ativa',
          em_andamento: true,  // NOVO CAMPO
          pecas_concluidas: 0,  // NOVO CAMPO
          ts_inicio: new Date().toISOString(),
          origem_device_id: device_id || 'unknown',
          audit: JSON.stringify({
            created_by: user_id,
            created_at: new Date().toISOString()
          })
        })
        .select('*, users(nome), processes(nome), ofs(codigo, quantidade)')
        .single();

      if (createError) {
        console.error('❌ Erro ao criar atividade:', createError);
        throw createError;
      }

      console.log('✅ Atividade criada:', activity.id);

      // 6. ATUALIZAR STATUS DA OF PARA "EM_ANDAMENTO"
      console.log('🔄 Atualizando OF para em_andamento:', of_id);

      const { error: ofUpdateError } = await supabaseAdmin
        .from('ofs')
        .update({ status: 'em_andamento' })
        .eq('id', of_id);

      if (ofUpdateError) {
        console.error('❌ Erro ao atualizar OF:', ofUpdateError);
      } else {
        console.log('✅ OF atualizada para em_andamento com sucesso!');
      }

      res.status(201).json({
        success: true,
        message: 'Atividade iniciada com sucesso',
        data: activity
      });

    } catch (error) {
      console.error('❌ Erro ao iniciar atividade:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao iniciar atividade',
        error: error.message
      });
    }
  }
);

// =====================================================
// POST /:id/registrar-peca - REGISTRAR PEÇA INDIVIDUAL
// =====================================================
router.post('/:id/registrar-peca',
  authenticateToken,
  [
    param('id').isUUID().withMessage('ID da atividade deve ser UUID válido'),
    body('numero_peca').isInt({ min: 1 }).withMessage('numero_peca deve ser >= 1'),
    body('tempo_decorrido').isInt({ min: 0 }).withMessage('tempo_decorrido deve ser >= 0')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { numero_peca, tempo_decorrido } = req.body;

      console.log('📦 REGISTRANDO PEÇA:', { atividade_id: id, numero_peca, tempo_decorrido });

      // 1. Buscar atividade
      const { data: activity, error: findError } = await supabaseAdmin
        .from('activities')
        .select('*')
        .eq('id', id)
        .single();

      if (findError || !activity) {
        return res.status(404).json({
          success: false,
          message: 'Atividade não encontrada'
        });
      }

      // 2. Validar se atividade está ativa
      if (activity.status !== 'ativa') {
        return res.status(400).json({
          success: false,
          message: `Não é possível registrar peça com atividade ${activity.status}`
        });
      }

      // 3. Validar se não está em_andamento = false
      if (activity.em_andamento === false) {
        return res.status(400).json({
          success: false,
          message: 'Atividade já foi finalizada'
        });
      }

      // 4. Validar se não excede quantidade planejada
      if (numero_peca > activity.qty_planejada) {
        return res.status(400).json({
          success: false,
          message: `Peça ${numero_peca} excede a quantidade planejada (${activity.qty_planejada})`
        });
      }

      // 5. Verificar se peça já foi registrada
      const { data: existingPeca, error: checkError } = await supabaseAdmin
        .from('pecas_registradas')
        .select('id')
        .eq('atividade_id', id)
        .eq('numero_peca', numero_peca)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingPeca) {
        return res.status(400).json({
          success: false,
          message: `Peça ${numero_peca} já foi registrada anteriormente`
        });
      }

      // 6. Registrar peça
      const { data: peca, error: insertError } = await supabaseAdmin
        .from('pecas_registradas')
        .insert({
          atividade_id: id,
          of_id: activity.of_id,
          usuario_id: activity.user_id,
          processo_id: activity.process_id,
          numero_peca,
          tempo_decorrido,
          timestamp_conclusao: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir peça:', insertError);
        throw insertError;
      }

      // 7. Atualizar contador pecas_concluidas
      const { data: updatedActivity, error: updateError } = await supabaseAdmin
        .from('activities')
        .update({
          pecas_concluidas: activity.pecas_concluidas + 1
        })
        .eq('id', id)
        .select('pecas_concluidas, qty_planejada')
        .single();

      if (updateError) throw updateError;

      console.log(`✅ Peça ${numero_peca} registrada! (${updatedActivity.pecas_concluidas}/${updatedActivity.qty_planejada})`);

      // 8. Calcular TPU individual (tempo desta peça)
      let tempo_individual = tempo_decorrido;

      // Buscar peça anterior para calcular TPU individual
      if (numero_peca > 1) {
        const { data: pecaAnterior } = await supabaseAdmin
          .from('pecas_registradas')
          .select('tempo_decorrido')
          .eq('atividade_id', id)
          .eq('numero_peca', numero_peca - 1)
          .single();

        if (pecaAnterior) {
          tempo_individual = tempo_decorrido - pecaAnterior.tempo_decorrido;
        }
      }

      res.status(201).json({
        success: true,
        message: `Peça ${numero_peca} registrada com sucesso!`,
        data: {
          peca_id: peca.id,
          numero_peca,
          tempo_individual,
          tempo_total_decorrido: tempo_decorrido,
          pecas_concluidas: updatedActivity.pecas_concluidas,
          pecas_planejadas: updatedActivity.qty_planejada
        }
      });

    } catch (error) {
      console.error('❌ Erro ao registrar peça:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao registrar peça',
        error: error.message
      });
    }
  }
);

// =====================================================
// POST /:id/pause - PAUSAR ATIVIDADE
// =====================================================
router.post('/:id/pause',
  authenticateToken,
  [
    param('id').isUUID()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Buscar atividade
      const { data: activity, error: findError } = await supabaseAdmin
        .from('activities')
        .select('*')
        .eq('id', id)
        .single();

      if (findError || !activity) {
        return res.status(404).json({
          success: false,
          message: 'Atividade não encontrada'
        });
      }

      if (activity.status !== 'ativa') {
        return res.status(400).json({
          success: false,
          message: `Não é possível pausar uma atividade com status: ${activity.status}`
        });
      }

      // 2. Adicionar pausa
      const now = new Date().toISOString();
      const pausas = activity.pausas || [];
      pausas.push({
        ts_inicio: now,
        ts_fim: null,
        motivo: req.body.motivo || null
      });

      // 3. Atualizar atividade
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('activities')
        .update({
          status: 'pausada',
          pausas: pausas
        })
        .eq('id', id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      res.json({
        success: true,
        message: 'Atividade pausada com sucesso',
        data: updated
      });

    } catch (error) {
      console.error('Erro ao pausar atividade:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// =====================================================
// POST /:id/resume - RETOMAR ATIVIDADE
// =====================================================
router.post('/:id/resume',
  authenticateToken,
  [
    param('id').isUUID()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Buscar atividade
      const { data: activity, error: findError } = await supabaseAdmin
        .from('activities')
        .select('*')
        .eq('id', id)
        .single();

      if (findError || !activity) {
        return res.status(404).json({
          success: false,
          message: 'Atividade não encontrada'
        });
      }

      if (activity.status !== 'pausada') {
        return res.status(400).json({
          success: false,
          message: `Não é possível retomar uma atividade com status: ${activity.status}`
        });
      }

      // 2. Finalizar última pausa
      const now = new Date().toISOString();
      const pausas = activity.pausas || [];

      if (pausas.length > 0) {
        pausas[pausas.length - 1].ts_fim = now;
      }

      // 3. Atualizar atividade
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('activities')
        .update({
          status: 'ativa',
          pausas: pausas
        })
        .eq('id', id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      res.json({
        success: true,
        message: 'Atividade retomada com sucesso',
        data: updated
      });

    } catch (error) {
      console.error('Erro ao retomar atividade:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// =====================================================
// POST /:id/finish - FINALIZAR ATIVIDADE (atualizado para peça a peça)
// =====================================================
router.post('/:id/finish',
  authenticateToken,
  startLimiter,
  [
    param('id').isUUID(),
    body('qty_realizada').optional().isInt({ min: 0 }),
    body('qty_refugo').optional().isInt({ min: 0 }),
    body('motivo_refugo').optional({ nullable: true, checkFalsy: false }).isString(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      let { qty_realizada, qty_refugo, motivo_refugo } = req.body;

      // 1. Buscar atividade
      console.log('=' .repeat(60));
      console.log('🏁 INICIANDO FINALIZAÇÃO');
      console.log('Atividade ID:', id);

      const { data: activity, error: findError } = await supabaseAdmin
        .from('activities')
        .select('*')
        .eq('id', id)
        .single();

      if (findError || !activity) {
        console.log('❌ Atividade não encontrada:', id);
        return res.status(404).json({
          success: false,
          message: 'Atividade não encontrada'
        });
      }

      console.log('📊 Atividade ANTES de finalizar:', {
        id: activity.id,
        user_id: activity.user_id,
        status: activity.status,
        em_andamento: activity.em_andamento,
        ts_inicio: activity.ts_inicio,
        ts_fim: activity.ts_fim,
        pecas_concluidas: activity.pecas_concluidas
      });

      // 2. Validar status
      if (activity.status !== 'ativa' && activity.status !== 'pausada') {
        console.log('❌ Status inválido para finalizar:', activity.status);
        return res.status(400).json({
          success: false,
          message: `Não é possível finalizar uma atividade com status: ${activity.status}`
        });
      }

      // 2.5. NOVO: Se qty_realizada não foi informada, usar pecas_concluidas
      if (!qty_realizada && activity.pecas_concluidas > 0) {
        qty_realizada = activity.pecas_concluidas;
        console.log(`📊 Usando pecas_concluidas como qty_realizada: ${qty_realizada}`);
      }

      if (!qty_realizada) {
        return res.status(400).json({
          success: false,
          message: 'Informe a quantidade realizada ou registre peças individualmente'
        });
      }

      // 2.6. Validar quantidade realizada vs planejada (máximo 150%)
      const maxPermitido = Math.floor(activity.qty_planejada * 1.5);
      if (qty_realizada > maxPermitido) {
        return res.status(400).json({
          success: false,
          message: `Quantidade realizada (${qty_realizada}) excede muito o planejado (${activity.qty_planejada}). Máximo permitido: ${maxPermitido}`
        });
      }

      // 3. Se estava pausada, finalizar a última pausa
      const pausas = activity.pausas || [];
      if (activity.status === 'pausada' && pausas.length > 0) {
        const lastPause = pausas[pausas.length - 1];
        if (!lastPause.ts_fim) {
          lastPause.ts_fim = new Date().toISOString();
        }
      }

      // 4. Calcular tempo total
      const ts_fim = new Date();
      const ts_inicio = new Date(activity.ts_inicio + 'Z');
      let tempo_total_seg = Math.floor((ts_fim - ts_inicio) / 1000);

      // Subtrair tempo de pausas
      let tempo_pausas_seg = 0;
      for (const pausa of pausas) {
        if (pausa.ts_inicio && pausa.ts_fim) {
          const pause_start = new Date(pausa.ts_inicio + 'Z');
          const pause_end = new Date(pausa.ts_fim + 'Z');
          tempo_pausas_seg += Math.floor((pause_end - pause_start) / 1000);
        }
      }

      tempo_total_seg -= tempo_pausas_seg;

      // 5. Calcular TPU (Tempo Por Unidade)
      let tempo_unit_seg = null;
      if (qty_realizada > 0) {
        tempo_unit_seg = tempo_total_seg / qty_realizada;
      }

      // 6. Determinar status final
      let status = 'concluida';
      if (tempo_total_seg < 0 || tempo_total_seg > 86400) { // > 24h
        status = 'anomala';
      }

      // 7. Atualizar atividade com em_andamento = false
      const updateData = {
        status,
        em_andamento: false,  // IMPORTANTE: marcar como false ao finalizar
        ts_fim: ts_fim.toISOString(),
        qty_realizada: parseInt(qty_realizada),
        qty_refugo: parseInt(qty_refugo) || 0,
        motivo_refugo: qty_refugo > 0 ? motivo_refugo : null,
        tempo_total_seg,
        tempo_unit_seg: tempo_unit_seg ? parseFloat(tempo_unit_seg) : null,
        pausas
      };

      console.log('💾 Salvando finalização com dados:', updateData);

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('activities')
        .update(updateData)
        .eq('id', id)
        .select('*, users(nome), processes(nome), ofs(codigo)')
        .single();

      if (updateError) {
        console.error('❌ ERRO ao atualizar atividade:', updateError);
        throw updateError;
      }

      console.log('✅ Atividade ATUALIZADA:', {
        id: updated.id,
        status: updated.status,
        em_andamento: updated.em_andamento,
        ts_fim: updated.ts_fim,
        qty_realizada: updated.qty_realizada
      });

      // VERIFICAÇÃO: Buscar novamente para confirmar que salvou
      const { data: verificacao, error: verifyError } = await supabaseAdmin
        .from('activities')
        .select('id, status, em_andamento, ts_fim')
        .eq('id', id)
        .single();

      console.log('🔍 VERIFICAÇÃO pós-salvamento:', verificacao);

      if (verifyError) {
        console.error('⚠️ Erro na verificação:', verifyError);
      }

      // 8. VOLTAR STATUS DA OF PARA "ABERTA"
      await supabaseAdmin
        .from('ofs')
        .update({ status: 'aberta' })
        .eq('id', activity.of_id);

      console.log('✅ Atividade finalizada com sucesso!');
      console.log('=' .repeat(60));

      res.json({
        success: true,
        message: 'Atividade finalizada com sucesso',
        data: updated,
        metrics: {
          tempo_total_seg,
          tempo_unit_seg: tempo_unit_seg ? tempo_unit_seg.toFixed(2) : null,
          pecas_registradas: activity.pecas_concluidas,
          status
        }
      });

    } catch (error) {
      console.error('Erro ao finalizar atividade:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// =====================================================
// GET /active/:user_id - BUSCAR SESSÃO ATIVA (com pecas_concluidas)
// =====================================================
router.get('/active/:user_id',
  authenticateToken,
  [
    param('user_id').isUUID()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { user_id } = req.params;

      const { data, error } = await supabaseAdmin
        .from('activities')
        .select('*, users(nome), processes(nome), ofs(codigo, quantidade)')
        .eq('user_id', user_id)
        .in('status', ['ativa', 'pausada'])
        .order('ts_inicio', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      res.json({
        success: true,
        data: data || null
      });

    } catch (error) {
      console.error('Erro ao buscar sessão ativa:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// =====================================================
// POST /force-close-all/:user_id - EMERGÊNCIA: FECHAR TODAS AS SESSÕES ABERTAS
// =====================================================
router.post('/force-close-all/:user_id',
  authenticateToken,
  [
    param('user_id').isUUID()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { user_id } = req.params;

      console.log('=' .repeat(60));
      console.log('🚨 FORÇANDO FECHAMENTO DE TODAS AS ATIVIDADES');
      console.log('Usuario ID:', user_id);

      // 1. Buscar todas as atividades abertas
      const { data: abertas, error: findError } = await supabaseAdmin
        .from('activities')
        .select('id, status, em_andamento, ts_inicio, process_id, of_id')
        .eq('user_id', user_id)
        .or('em_andamento.eq.true,status.in.(ativa,pausada)');

      if (findError) {
        console.error('❌ Erro ao buscar atividades abertas:', findError);
        throw findError;
      }

      console.log('📋 Atividades abertas encontradas:', abertas?.length || 0);

      if (!abertas || abertas.length === 0) {
        console.log('✅ Nenhuma atividade aberta encontrada');
        console.log('=' .repeat(60));
        return res.json({
          success: true,
          message: 'Nenhuma atividade aberta encontrada',
          fechadas: 0
        });
      }

      console.log('Detalhes das atividades:', JSON.stringify(abertas, null, 2));

      // 2. Fechar todas forçadamente
      const agora = new Date().toISOString();
      const idsParaFechar = abertas.map(a => a.id);

      const { data: fechadas, error: updateError } = await supabaseAdmin
        .from('activities')
        .update({
          status: 'concluida',
          em_andamento: false,
          ts_fim: agora,
          qty_realizada: 0, // Forçar quantidade zero se não foi registrada
          tempo_total_seg: 0
        })
        .in('id', idsParaFechar)
        .select('id, status, em_andamento, ts_fim');

      if (updateError) {
        console.error('❌ Erro ao fechar atividades:', updateError);
        throw updateError;
      }

      console.log('✅ Atividades fechadas:', fechadas?.length || 0);
      console.log('Detalhes:', JSON.stringify(fechadas, null, 2));
      console.log('=' .repeat(60));

      res.json({
        success: true,
        message: `${fechadas?.length || 0} atividade(s) foram fechadas forçadamente`,
        atividades: fechadas
      });

    } catch (error) {
      console.error('❌ Erro no force-close-all:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao forçar fechamento de atividades',
        error: error.message
      });
    }
  }
);

// =====================================================
// GET /debug/:user_id - DEBUG: LISTAR TODAS AS ATIVIDADES DO USUÁRIO
// =====================================================
router.get('/debug/:user_id',
  authenticateToken,
  [
    param('user_id').isUUID()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { user_id } = req.params;

      console.log('🔍 DEBUG - Listando todas as atividades do usuário:', user_id);

      const { data: atividades, error } = await supabaseAdmin
        .from('activities')
        .select('id, status, em_andamento, ts_inicio, ts_fim, qty_planejada, qty_realizada, pecas_concluidas, processes(nome), ofs(codigo)')
        .eq('user_id', user_id)
        .order('ts_inicio', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Separar por status
      const abertas = atividades?.filter(a => a.em_andamento === true) || [];
      const ativas = atividades?.filter(a => a.status === 'ativa') || [];
      const pausadas = atividades?.filter(a => a.status === 'pausada') || [];
      const concluidas = atividades?.filter(a => a.status === 'concluida') || [];

      const resumo = {
        total: atividades?.length || 0,
        em_andamento_true: abertas.length,
        status_ativa: ativas.length,
        status_pausada: pausadas.length,
        status_concluida: concluidas.length,
        problematicas: atividades?.filter(a =>
          (a.status === 'concluida' && a.em_andamento === true) ||
          (a.em_andamento === false && (a.status === 'ativa' || a.status === 'pausada'))
        ) || []
      };

      console.log('📊 Resumo:', resumo);

      res.json({
        success: true,
        resumo,
        atividades: atividades || []
      });

    } catch (error) {
      console.error('❌ Erro no debug:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// =====================================================
// GET /:id/pecas - LISTAR PEÇAS REGISTRADAS DE UMA ATIVIDADE
// =====================================================
router.get('/:id/pecas',
  authenticateToken,
  [
    param('id').isUUID()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabaseAdmin
        .from('v_tpu_por_peca')
        .select('*')
        .eq('atividade_id', id)
        .order('numero_peca', { ascending: true });

      if (error) throw error;

      res.json({
        success: true,
        data: data || []
      });

    } catch (error) {
      console.error('Erro ao buscar peças:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;
