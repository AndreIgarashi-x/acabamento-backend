// Script para listar todas as atividades de uma OF (versão simples)
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function listActivities() {
  try {
    const ofId = '504d69d1-ef71-4d0c-b99b-815bd133b37c';

    console.log('🔍 Buscando atividades da OF 011537...\n');

    // Buscar TODAS as atividades dessa OF (sem JOINs)
    const { data: atividades, error: atError } = await supabase
      .from('activities')
      .select('*')
      .eq('of_id', ofId);

    if (atError) {
      console.error('❌ Erro ao buscar atividades:', atError);
      return;
    }

    if (!atividades || atividades.length === 0) {
      console.log('⚠️  Nenhuma atividade encontrada para esta OF');
      return;
    }

    console.log(`📋 Atividades encontradas: ${atividades.length}\n`);
    console.log('='.repeat(80));

    for (let i = 0; i < atividades.length; i++) {
      const at = atividades[i];

      console.log(`\n${i + 1}. Atividade ID: ${at.id}`);
      console.log(`   Processo ID: ${at.processo_id}`);
      console.log(`   Usuário ID: ${at.usuario_id}`);
      console.log(`   Status: ${at.status}`);
      console.log(`   Peças concluídas: ${at.pecas_concluidas}`);
      console.log(`   Tempo total: ${at.tempo_total_seg}s (${(at.tempo_total_seg/60).toFixed(1)} min)`);

      // Buscar nome do processo
      const { data: processo } = await supabase
        .from('processes')
        .select('nome')
        .eq('id', at.processo_id)
        .single();

      if (processo) {
        console.log(`   Processo: ${processo.nome}`);
      }

      // Buscar nome do usuário
      const { data: usuario } = await supabase
        .from('users')
        .select('nome')
        .eq('id', at.usuario_id)
        .single();

      if (usuario) {
        console.log(`   Colaborador: ${usuario.nome}`);
      }

      // Contar registros de peças
      const { count } = await supabase
        .from('pecas_registradas')
        .select('*', { count: 'exact', head: true })
        .eq('atividade_id', at.id);

      console.log(`   Registros de peças: ${count || 0}`);
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

listActivities();
