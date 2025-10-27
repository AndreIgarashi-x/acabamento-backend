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

// =====================================================
// FUNÇÕES AUXILIARES PARA ANÁLISE DE PROCESSOS
// =====================================================

/**
 * Obtém resumo geral de produção
 */
async function getResumoGeral(dataInicio, dataFim) {
  try {
    console.log('📊 Buscando resumo geral...');

    // Total de peças e colaboradores
    const { data: pecasData, error: pecasError } = await supabaseAdmin
      .from('pecas_registradas')
      .select('id, atividade_id, activities!inner(user_id, process_id)')
      .gte('created_at', dataInicio.toISOString())
      .lte('created_at', dataFim.toISOString());

    if (pecasError) throw pecasError;

    const totalPecas = pecasData?.length || 0;
    const colaboradoresAtivos = pecasData ? new Set(pecasData.map(p => p.activities.user_id)).size : 0;
    const processosExecutados = pecasData ? new Set(pecasData.map(p => p.activities.process_id)).size : 0;

    // TPU geral e peças por hora usando view
    const { data: tpuData, error: tpuError } = await supabaseAdmin
      .from('v_tpu_por_peca')
      .select('tpu_minutos')
      .gte('timestamp_conclusao', dataInicio.toISOString())
      .lte('timestamp_conclusao', dataFim.toISOString())
      .not('tpu_minutos', 'is', null);

    if (tpuError) throw tpuError;

    let tpuGeral = 0;
    if (tpuData && tpuData.length > 0) {
      const soma = tpuData.reduce((acc, p) => acc + (p.tpu_minutos || 0), 0);
      tpuGeral = parseFloat((soma / tpuData.length).toFixed(1));
    }

    // Peças por hora
    let pecasPorHora = 0;
    if (pecasData && pecasData.length > 0) {
      const timestamps = pecasData
        .map(p => new Date(p.created_at))
        .filter(d => !isNaN(d.getTime()));

      if (timestamps.length > 1) {
        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps);
        const horasTrabalhadas = (maxTime - minTime) / (1000 * 60 * 60);

        if (horasTrabalhadas > 0) {
          pecasPorHora = Math.round(totalPecas / horasTrabalhadas);
        }
      }
    }

    // Processo mais rápido - calcular TPU médio por processo
    let processoMaisRapido = null;

    if (pecasData && pecasData.length > 0) {
      // Agrupar peças por processo
      const tpuPorProcesso = {};

      const { data: todasTpus, error: todasTpusError } = await supabaseAdmin
        .from('v_tpu_por_peca')
        .select('tpu_minutos, atividade_id')
        .gte('timestamp_conclusao', dataInicio.toISOString())
        .lte('timestamp_conclusao', dataFim.toISOString())
        .not('tpu_minutos', 'is', null);

      if (!todasTpusError && todasTpus && todasTpus.length > 0) {
        // Mapear atividade_id para process_id
        const atividadeParaProcesso = {};
        pecasData.forEach(p => {
          atividadeParaProcesso[p.atividade_id] = p.activities.process_id;
        });

        // Agrupar TPUs por processo
        todasTpus.forEach(tpu => {
          const processId = atividadeParaProcesso[tpu.atividade_id];
          if (processId) {
            if (!tpuPorProcesso[processId]) {
              tpuPorProcesso[processId] = [];
            }
            tpuPorProcesso[processId].push(tpu.tpu_minutos);
          }
        });

        // Calcular média por processo e encontrar o mais rápido
        let menorTpu = Infinity;
        let processoIdMaisRapido = null;

        Object.keys(tpuPorProcesso).forEach(processId => {
          const tpus = tpuPorProcesso[processId];
          const media = tpus.reduce((acc, val) => acc + val, 0) / tpus.length;

          if (media < menorTpu) {
            menorTpu = media;
            processoIdMaisRapido = processId;
          }
        });

        // Buscar nome do processo
        if (processoIdMaisRapido) {
          const { data: processo, error: processoError } = await supabaseAdmin
            .from('processes')
            .select('nome')
            .eq('id', processoIdMaisRapido)
            .single();

          if (!processoError && processo) {
            processoMaisRapido = {
              nome: processo.nome,
              tpu_medio: parseFloat(menorTpu.toFixed(1))
            };
          }
        }
      }
    }

    return {
      total_pecas: totalPecas,
      processo_mais_rapido: processoMaisRapido,
      tpu_geral: tpuGeral,
      pecas_por_hora: pecasPorHora,
      colaboradores_ativos: colaboradoresAtivos,
      processos_executados: processosExecutados
    };

  } catch (error) {
    console.error('❌ Erro em getResumoGeral:', error);
    return {
      total_pecas: 0,
      processo_mais_rapido: null,
      tpu_geral: 0,
      pecas_por_hora: 0,
      colaboradores_ativos: 0,
      processos_executados: 0
    };
  }
}

/**
 * Análise detalhada por processo
 */
async function getAnaliseProcessos(dataInicio, dataFim) {
  try {
    console.log('📋 Analisando processos...');

    // Buscar todos os processos ativos
    const { data: processos, error: processosError } = await supabaseAdmin
      .from('processes')
      .select('id, nome')
      .eq('ativo', true);

    if (processosError) throw processosError;
    if (!processos || processos.length === 0) return [];

    const resultado = [];

    for (const processo of processos) {
      // Peças do processo
      const { data: pecas, error: pecasError } = await supabaseAdmin
        .from('pecas_registradas')
        .select('id, atividade_id, activities!inner(user_id, process_id)')
        .eq('activities.process_id', processo.id)
        .gte('created_at', dataInicio.toISOString())
        .lte('created_at', dataFim.toISOString());

      if (pecasError) {
        console.error(`Erro ao buscar peças do processo ${processo.nome}:`, pecasError);
        continue;
      }

      const totalPecas = pecas?.length || 0;
      if (totalPecas === 0) continue; // Pular processos sem produção

      // Atividades do processo
      const atividadesIds = pecas ? [...new Set(pecas.map(p => p.atividade_id))] : [];
      const totalAtividades = atividadesIds.length;
      const colaboradores = pecas ? new Set(pecas.map(p => p.activities.user_id)).size : 0;

      // TPU médio e variação usando a view
      const { data: tpuData, error: tpuError } = await supabaseAdmin
        .from('v_tpu_por_peca')
        .select('tpu_minutos, timestamp_conclusao')
        .in('atividade_id', atividadesIds.length > 0 ? atividadesIds : [-1])
        .gte('timestamp_conclusao', dataInicio.toISOString())
        .lte('timestamp_conclusao', dataFim.toISOString())
        .not('tpu_minutos', 'is', null)
        .order('timestamp_conclusao', { ascending: true });

      let tpuMedio = 0;
      let variacaoTpu = 0;
      let primeiroTpu = null;
      let ultimoTpu = null;

      if (!tpuError && tpuData && tpuData.length > 0) {
        const tpus = tpuData.map(t => t.tpu_minutos);
        const soma = tpus.reduce((acc, val) => acc + val, 0);
        tpuMedio = parseFloat((soma / tpus.length).toFixed(1));

        // Variação (desvio padrão)
        if (tpus.length > 1) {
          const media = soma / tpus.length;
          const somaQuadrados = tpus.reduce((acc, val) => acc + Math.pow(val - media, 2), 0);
          variacaoTpu = parseFloat(Math.sqrt(somaQuadrados / tpus.length).toFixed(1));
        }

        primeiroTpu = parseFloat(tpuData[0].tpu_minutos.toFixed(1));
        ultimoTpu = parseFloat(tpuData[tpuData.length - 1].tpu_minutos.toFixed(1));
      }

      // Tempo total em minutos
      const { data: atividadesData, error: atividadesError } = await supabaseAdmin
        .from('activities')
        .select('tempo_total_seg')
        .in('id', atividadesIds.length > 0 ? atividadesIds : [-1])
        .not('tempo_total_seg', 'is', null);

      let tempoTotalMinutos = 0;
      if (!atividadesError && atividadesData && atividadesData.length > 0) {
        const totalSeg = atividadesData.reduce((acc, a) => acc + (a.tempo_total_seg || 0), 0);
        tempoTotalMinutos = Math.round(totalSeg / 60);
      }

      resultado.push({
        nome: processo.nome,
        tpu_medio: tpuMedio,
        total_pecas: totalPecas,
        total_atividades: totalAtividades,
        colaboradores: colaboradores,
        tempo_total_minutos: tempoTotalMinutos,
        variacao_tpu: variacaoTpu,
        primeiro_tpu: primeiroTpu,
        ultimo_tpu: ultimoTpu
      });
    }

    // Ordenar por total de peças (decrescente)
    resultado.sort((a, b) => b.total_pecas - a.total_pecas);

    return resultado;

  } catch (error) {
    console.error('❌ Erro em getAnaliseProcessos:', error);
    return [];
  }
}

/**
 * Evolução temporal (por hora)
 */
async function getEvolucaoTemporal(dataInicio, dataFim, periodo = 'hoje') {
  try {
    console.log('📈 Calculando evolução temporal...');

    const { data: pecas, error: pecasError } = await supabaseAdmin
      .from('v_tpu_por_peca')
      .select('tpu_minutos, timestamp_conclusao')
      .gte('timestamp_conclusao', dataInicio.toISOString())
      .lte('timestamp_conclusao', dataFim.toISOString())
      .not('tpu_minutos', 'is', null)
      .order('timestamp_conclusao', { ascending: true });

    if (pecasError) throw pecasError;
    if (!pecas || pecas.length === 0) return [];

    // Agrupar por hora (hoje) ou por dia (semana/mês)
    const agruparPorDia = periodo !== 'hoje';
    const agrupado = {};

    pecas.forEach(peca => {
      const data = new Date(peca.timestamp_conclusao);

      let chave;
      if (agruparPorDia) {
        // Agrupar por dia (formato DD/MM)
        chave = `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // Agrupar por hora (formato HH:00)
        chave = `${String(data.getHours()).padStart(2, '0')}:00`;
      }

      if (!agrupado[chave]) {
        agrupado[chave] = {
          tpus: [],
          pecas: 0
        };
      }

      agrupado[chave].tpus.push(peca.tpu_minutos);
      agrupado[chave].pecas++;
    });

    // Calcular médias e formatar
    const resultado = Object.keys(agrupado)
      .sort()
      .map(chave => {
        const dados = agrupado[chave];
        const soma = dados.tpus.reduce((acc, val) => acc + val, 0);
        const tpuMedio = parseFloat((soma / dados.tpus.length).toFixed(1));

        return {
          hora: chave, // Mantém "hora" como nome da propriedade para compatibilidade com frontend
          tpu_medio: tpuMedio,
          pecas: dados.pecas
        };
      });

    console.log(`   Agrupamento: ${agruparPorDia ? 'por dia' : 'por hora'}, pontos: ${resultado.length}`);
    return resultado;

  } catch (error) {
    console.error('❌ Erro em getEvolucaoTemporal:', error);
    return [];
  }
}

/**
 * Ranking de volume por processo
 */
async function getRankingVolume(dataInicio, dataFim) {
  try {
    console.log('🏆 Calculando ranking de volume...');

    const { data: pecas, error: pecasError } = await supabaseAdmin
      .from('pecas_registradas')
      .select('id, activities!inner(process_id, processes!inner(nome))')
      .gte('created_at', dataInicio.toISOString())
      .lte('created_at', dataFim.toISOString());

    if (pecasError) throw pecasError;
    if (!pecas || pecas.length === 0) return [];

    // Contar por processo
    const porProcesso = {};
    const totalGeral = pecas.length;

    pecas.forEach(peca => {
      const nomeProcesso = peca.activities.processes.nome;
      if (!porProcesso[nomeProcesso]) {
        porProcesso[nomeProcesso] = 0;
      }
      porProcesso[nomeProcesso]++;
    });

    // Formatar e calcular percentual
    const resultado = Object.keys(porProcesso)
      .map(processo => ({
        processo,
        pecas: porProcesso[processo],
        percentual: parseFloat(((porProcesso[processo] / totalGeral) * 100).toFixed(1))
      }))
      .sort((a, b) => b.pecas - a.pecas)
      .slice(0, 5); // Top 5

    return resultado;

  } catch (error) {
    console.error('❌ Erro em getRankingVolume:', error);
    return [];
  }
}

// =====================================================
// GET /processos - ANÁLISE DE PROCESSOS
// =====================================================
router.get('/processos', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Iniciando análise de processos...');

    const { periodo = 'mes' } = req.query;

    // Definir datas baseado no período
    let dataInicio, dataFim;

    if (periodo === 'hoje') {
      dataInicio = new Date();
      dataInicio.setHours(0, 0, 0, 0);
      dataFim = new Date();
      dataFim.setHours(23, 59, 59, 999);
    } else if (periodo === 'semana') {
      dataFim = new Date();
      dataFim.setHours(23, 59, 59, 999);
      dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - 7);
      dataInicio.setHours(0, 0, 0, 0);
    } else if (periodo === 'mes') {
      // Primeiro dia do mês atual
      dataInicio = new Date();
      dataInicio.setDate(1);
      dataInicio.setHours(0, 0, 0, 0);

      // Último dia do mês atual
      dataFim = new Date();
      dataFim.setMonth(dataFim.getMonth() + 1);
      dataFim.setDate(0);
      dataFim.setHours(23, 59, 59, 999);
    } else {
      // Período customizado via query params
      dataInicio = req.query.data_inicio ? new Date(req.query.data_inicio) : new Date();
      dataFim = req.query.data_fim ? new Date(req.query.data_fim) : new Date();
    }

    // Formatar descrição do período
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    let periodoDescricao = '';

    if (periodo === 'hoje') {
      periodoDescricao = `Hoje (${dataInicio.toLocaleDateString('pt-BR')})`;
    } else if (periodo === 'semana') {
      periodoDescricao = `Últimos 7 dias (${dataInicio.toLocaleDateString('pt-BR')} - ${dataFim.toLocaleDateString('pt-BR')})`;
    } else if (periodo === 'mes') {
      const mes = meses[dataInicio.getMonth()];
      const ano = dataInicio.getFullYear();
      periodoDescricao = `${mes} ${ano} (${dataInicio.toLocaleDateString('pt-BR')} - ${dataFim.toLocaleDateString('pt-BR')})`;
    } else {
      periodoDescricao = `${dataInicio.toLocaleDateString('pt-BR')} - ${dataFim.toLocaleDateString('pt-BR')}`;
    }

    console.log(`📅 Período: ${periodoDescricao}`);
    console.log(`   Início: ${dataInicio.toISOString()}`);
    console.log(`   Fim: ${dataFim.toISOString()}`);

    // Executar todas as queries em paralelo
    const [resumo, processos, evolucao, ranking] = await Promise.all([
      getResumoGeral(dataInicio, dataFim),
      getAnaliseProcessos(dataInicio, dataFim),
      getEvolucaoTemporal(dataInicio, dataFim, periodo), // Passa o período para agrupamento correto
      getRankingVolume(dataInicio, dataFim)
    ]);

    const response = {
      success: true,
      data: {
        periodo: {
          inicio: dataInicio.toISOString(),
          fim: dataFim.toISOString(),
          tipo: periodo,
          descricao: periodoDescricao
        },
        resumo,
        processos,
        evolucao_temporal: evolucao,
        ranking_volume: ranking
      }
    };

    console.log('✅ Análise de processos concluída!');
    console.log(`   - Total de peças: ${resumo.total_pecas}`);
    console.log(`   - Processos analisados: ${processos.length}`);
    console.log(`   - Pontos de evolução: ${evolucao.length}`);

    res.json(response);

  } catch (error) {
    console.error('❌ Erro ao buscar análise de processos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar análise de processos',
      error: error.message
    });
  }
});

module.exports = router;