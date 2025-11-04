// Script para deletar atividade específica
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function deleteActivity() {
  try {
    const atividadeId = '9a2f1948-d855-4bcf-954c-39954001aeb2';

    console.log('🗑️  Deletando atividade...\n');
    console.log(`   ID: ${atividadeId}\n`);

    // 1. Deletar registros de peças primeiro (foreign key)
    console.log('1️⃣  Deletando registros de peças...');
    const { error: pecasError } = await supabase
      .from('pecas_registradas')
      .delete()
      .eq('atividade_id', atividadeId);

    if (pecasError) {
      console.error('❌ Erro ao deletar peças:', pecasError);
      return;
    }

    console.log('   ✅ Registros de peças deletados\n');

    // 2. Deletar atividade
    console.log('2️⃣  Deletando atividade...');
    const { error: actError } = await supabase
      .from('activities')
      .delete()
      .eq('id', atividadeId);

    if (actError) {
      console.error('❌ Erro ao deletar atividade:', actError);
      return;
    }

    console.log('   ✅ Atividade deletada\n');

    console.log('✅ Operação concluída com sucesso!\n');
    console.log('A operação "Fazer barra" da OF 011537 foi removida do sistema.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

deleteActivity();
