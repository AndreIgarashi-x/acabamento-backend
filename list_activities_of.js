// Script para listar todas as atividades de uma OF
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function listActivities() {
  try {
    console.log('🔍 Buscando OF 011537...\n');

    // 1. Buscar OF 011537
    const { data: of, error: ofError } = await supabase
      .from('ofs')
      .select('id, codigo, referencia, descricao')
      .eq('codigo', '011537')
      .single();

    if (ofError || !of) {
      console.error('❌ OF 011537 não encontrada');
      return;
    }

    console.log(`✅ OF encontrada:`);
    console.log(`   Código: ${of.codigo}`);
    console.log(`   Produto: ${of.referencia} - ${of.descricao}`);
    console.log(`   ID: ${of.id}\n`);

    // 2. Buscar TODAS as atividades dessa OF
    const { data: atividades, error: atError } = await supabase
      .from('activities')
      .select(`
        id,
        of_id,
        processo_id,
        usuario_id,
        status,
        pecas_concluidas,
        tempo_total_seg,
        ts_inicio,
        ts_fim,
        users!activities_usuario_id_fkey (nome),
        processes!activities_processo_id_fkey (nome)
      `)
      .eq('of_id', of.id);

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

    atividades.forEach((at, idx) => {
      console.log(`\n${idx + 1}. Atividade ID: ${at.id}`);
      console.log(`   Processo: ${at.processes?.nome || 'N/A'}`);
      console.log(`   Colaborador: ${at.users?.nome || 'N/A'}`);
      console.log(`   Status: ${at.status}`);
      console.log(`   Peças concluídas: ${at.pecas_concluidas}`);
      console.log(`   Tempo total: ${at.tempo_total_seg}s (${(at.tempo_total_seg/60).toFixed(1)} min)`);
      console.log(`   Início: ${at.ts_inicio}`);
      console.log(`   Fim: ${at.ts_fim}`);
    });

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

listActivities();
