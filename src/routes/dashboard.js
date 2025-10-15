const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middlewares/auth');

// =====================================================
// GET /stats - ESTATÍSTICAS COMPLETAS DO DASHBOARD
// =====================================================
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Buscando estatísticas do dashboard...');

    // ============================================
    // 1. ESTATÍSTICAS GERAIS
    // ============================================

    // Total de OFs
    const { count: totalOFs, error: totalOFsError } = await supabaseAdmin
      .from('ofs')
      .select('*', { count: 'exact', head: true });

    if (totalOFsError) throw totalOFsError;

    // OFs por status
    const { data: ofsStatus, error: ofsStatusError } = await supabaseAdmin
      .from('ofs')
      .select('status');

    if (ofsStatusError) throw ofsStatusError;

    const ofsAbertas = ofsStatus.filter(of => of.status === 'aberta').length;
    const ofsEmAndamento = ofsStatus.filter(of => of.status === 'em_andamento').length;
    const ofsConcluidas = ofsStatus.filter(of => of.status === 'concluida').length;

    // Total de atividades
    const { count: totalAtividades, error: totalAtividadesError } = await supabaseAdmin
      .from('activities')
      .select('*', { count: 'exact', head: true });

    if (totalAtividadesError) throw totalAtividadesError;

    // Atividades de hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const { count: atividadesHoje, error: atividadesHojeError } = await supabaseAdmin
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', hoje.toISOString());

    if (atividadesHojeError) throw atividadesHojeError;

    // Usuários ativos (com atividades nos últimos 7 dias)
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    const { data: atividadesRecentes, error: atividadesRecentesError } = await supabaseAdmin
      .from('activities')
      .select('user_id')
      .gte('created_at', seteDiasAtras.toISOString());

    if (atividadesRecentesError) throw atividadesRecentesError;

    const usuariosUnicos = new Set(atividadesRecentes.map(a => a.user_id));
    const usuariosAtivos = usuariosUnicos.size;

    // Tempo médio de atividade (em minutos)
    const { data: atividadesFinalizadas, error: atividadesFinalizadasError } = await supabaseAdmin
      .from('activities')
      .select('tempo_total_seg')
      .not('tempo_total_seg', 'is', null)
      .in('status', ['concluida', 'anomala']);

    if (atividadesFinalizadasError) throw atividadesFinalizadasError;

    let tempoMedioAtividade = 0;
    if (atividadesFinalizadas.length > 0) {
      const somaTempos = atividadesFinalizadas.reduce((acc, a) => acc + (a.tempo_total_seg || 0), 0);
      tempoMedioAtividade = Math.round(somaTempos / atividadesFinalizadas.length / 60); // Converter para minutos
    }

    // ============================================
    // 2. GRÁFICO: STATUS DAS OFs
    // ============================================
    const graficosOfsStatus = [
      {
        status: 'aberta',
        nome: 'Abertas',
        quantidade: ofsAbertas
      },
      {
        status: 'em_andamento',
        nome: 'Em Andamento',
        quantidade: ofsEmAndamento
      },
      {
        status: 'concluida',
        nome: 'Concluídas',
        quantidade: ofsConcluidas
      }
    ];

    // ============================================
    // 3. GRÁFICO: ATIVIDADES POR DIA (últimos 7 dias)
    // ============================================
    const atividadesPorDia = [];

    for (let i = 6; i >= 0; i--) {
      const data = new Date();
      data.setDate(data.getDate() - i);
      data.setHours(0, 0, 0, 0);

      const dataFim = new Date(data);
      dataFim.setHours(23, 59, 59, 999);

      const { count, error: countError } = await supabaseAdmin
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', data.toISOString())
        .lte('created_at', dataFim.toISOString());

      if (countError) throw countError;

      // Formatar dia (ex: "15/10")
      const dia = `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`;

      atividadesPorDia.push({
        dia,
        quantidade: count || 0
      });
    }

    // ============================================
    // 4. GRÁFICO: PRODUÇÃO POR USUÁRIO
    // ============================================
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('users')
      .select('id, nome')
      .eq('ativo', true);

    if (usuariosError) throw usuariosError;

    const producaoPorUsuario = await Promise.all(
      usuarios.map(async (user) => {
        const { count, error: countError } = await supabaseAdmin
          .from('activities')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['concluida', 'anomala']);

        if (countError) {
          console.error(`Erro ao contar atividades do usuário ${user.nome}:`, countError);
          return {
            nome: user.nome,
            atividades: 0
          };
        }

        return {
          nome: user.nome,
          atividades: count || 0
        };
      })
    );

    // Ordenar por quantidade (top 5)
    producaoPorUsuario.sort((a, b) => b.atividades - a.atividades);
    const top5Usuarios = producaoPorUsuario.slice(0, 5);

    // ============================================
    // 5. GRÁFICO: TEMPO MÉDIO POR PROCESSO
    // ============================================
    const { data: processos, error: processosError } = await supabaseAdmin
      .from('processes')
      .select('id, nome')
      .eq('ativo', true);

    if (processosError) throw processosError;

    const temposPorProcesso = await Promise.all(
      processos.map(async (process) => {
        const { data: atividadesProcesso, error: atividadesProcessoError } = await supabaseAdmin
          .from('activities')
          .select('tempo_total_seg')
          .eq('process_id', process.id)
          .not('tempo_total_seg', 'is', null)
          .in('status', ['concluida', 'anomala']);

        if (atividadesProcessoError) {
          console.error(`Erro ao buscar atividades do processo ${process.nome}:`, atividadesProcessoError);
          return {
            processo: process.nome,
            tempoMedio: 0
          };
        }

        let tempoMedio = 0;
        if (atividadesProcesso.length > 0) {
          const somaTempos = atividadesProcesso.reduce((acc, a) => acc + (a.tempo_total_seg || 0), 0);
          tempoMedio = Math.round(somaTempos / atividadesProcesso.length / 60); // Converter para minutos
        }

        return {
          processo: process.nome,
          tempoMedio
        };
      })
    );

    // Ordenar por tempo médio
    temposPorProcesso.sort((a, b) => b.tempoMedio - a.tempoMedio);

    // ============================================
    // RESPOSTA FINAL
    // ============================================
    const response = {
      success: true,
      data: {
        stats: {
          totalOFs: totalOFs || 0,
          ofsAbertas,
          ofsEmAndamento,
          ofsConcluidas,
          totalAtividades: totalAtividades || 0,
          atividadesHoje: atividadesHoje || 0,
          usuariosAtivos,
          tempoMedioAtividade
        },
        graficos: {
          ofsStatus: graficosOfsStatus,
          atividadesPorDia,
          producaoPorUsuario: top5Usuarios,
          temposPorProcesso
        }
      }
    };

    console.log('✅ Estatísticas calculadas com sucesso!');
    res.json(response);

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas do dashboard',
      error: error.message
    });
  }
});

// =====================================================
// GET /live - SESSÕES ATIVAS (TEMPO REAL)
// =====================================================
router.get('/live', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('v_activities_live')
      .select('*');

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;