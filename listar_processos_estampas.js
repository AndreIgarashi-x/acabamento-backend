// =====================================================
// LISTAR PROCESSOS DO MÓDULO ESTAMPAS
// =====================================================

require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function listarProcessosEstampas() {
  try {
    console.log('📋 Listando processos do módulo Estampas...\n');

    // Buscar módulo Estampas
    const { data: modulo, error: moduloError } = await supabaseAdmin
      .from('modulos')
      .select('id, codigo, nome_exibicao')
      .eq('codigo', 'estampas')
      .single();

    if (moduloError) {
      throw new Error(`Erro ao buscar módulo: ${moduloError.message}`);
    }

    console.log(`✅ Módulo: ${modulo.nome_exibicao} (ID: ${modulo.id})\n`);

    // Buscar processos
    const { data: processos, error: processosError } = await supabaseAdmin
      .from('processes')
      .select('id, nome, ativo')
      .eq('modulo_id', modulo.id)
      .order('nome');

    if (processosError) {
      throw new Error(`Erro ao buscar processos: ${processosError.message}`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📝 Processos do Módulo Estampas (${processos.length} processos):`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    processos.forEach((proc, index) => {
      const status = proc.ativo ? '✅' : '❌';
      console.log(`${status} ${index + 1}. ${proc.nome} (ID: ${proc.id})`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar
listarProcessosEstampas()
  .then(() => {
    console.log('👋 Script finalizado!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
