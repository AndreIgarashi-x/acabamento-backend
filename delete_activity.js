// Script para excluir atividade específica
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function deleteActivity() {
  try {
    console.log('🔍 Buscando atividade...\n');

    // 1. Buscar OF 011537
    const { data: of, error: ofError } = await supabase
      .from('ofs')
      .select('id, codigo')
      .eq('codigo', '011537')
      .single();

    if (ofError || !of) {
      console.error('❌ OF 011537 não encontrada');
      return;
    }

    console.log(`✅ OF encontrada: ${of.codigo} (ID: ${of.id})`);

    // 2. Buscar processo "Fazer barra"
    const { data: processo, error: procError } = await supabase
      .from('processes')
      .select('id, nome')
      .ilike('nome', '%fazer barra%')
      .single();

    if (procError || !processo) {
      console.error('❌ Processo "Fazer barra" não encontrado');
      return;
    }

    console.log(`✅ Processo encontrado: ${processo.nome} (ID: ${processo.id})`);

    // 3. Buscar atividades que combinam OF + Processo
    const { data: atividades, error: atError } = await supabase
      .from('activities')
      .select(`
        id,
        of_id,
        processo_id,
        usuario_id,
        status,
        pecas_concluidas,
        users!activities_usuario_id_fkey (nome)
      `)
      .eq('of_id', of.id)
      .eq('processo_id', processo.id);

    if (atError || !atividades || atividades.length === 0) {
      console.error('❌ Nenhuma atividade encontrada para OF 011537 - Fazer barra');
      return;
    }

    console.log(`\n📋 Atividades encontradas: ${atividades.length}`);
    atividades.forEach((at, idx) => {
      console.log(`\n${idx + 1}. Atividade ID: ${at.id}`);
      console.log(`   Colaborador: ${at.users?.nome || 'N/A'}`);
      console.log(`   Status: ${at.status}`);
      console.log(`   Peças concluídas: ${at.pecas_concluidas}`);
    });

    // 4. Vamos deletar TODAS as atividades encontradas
    for (const atividade of atividades) {
      console.log(`\n🗑️  Deletando atividade ${atividade.id}...`);

      // Deletar registros de peças primeiro (foreign key)
      const { data: deletedPecas, error: pecasError } = await supabase
        .from('pecas_registradas')
        .delete()
        .eq('atividade_id', atividade.id);

      if (pecasError) {
        console.error(`❌ Erro ao deletar peças da atividade ${atividade.id}:`, pecasError);
        continue;
      }

      console.log(`   ✅ Registros de peças deletados`);

      // Deletar atividade
      const { data: deletedActivity, error: actError } = await supabase
        .from('activities')
        .delete()
        .eq('id', atividade.id);

      if (actError) {
        console.error(`❌ Erro ao deletar atividade ${atividade.id}:`, actError);
        continue;
      }

      console.log(`   ✅ Atividade deletada`);
    }

    console.log('\n✅ Operação concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

deleteActivity();
