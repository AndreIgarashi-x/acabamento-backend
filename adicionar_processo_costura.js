// =====================================================
// ADICIONAR PROCESSO: Montagem de gola (Costura)
// =====================================================

require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function adicionarProcesso() {
  try {
    console.log('🚀 Adicionando processo "Montagem de gola" ao módulo Costura...\n');

    // 1. Buscar ID do módulo Costura
    const { data: moduloCostura, error: moduloError } = await supabaseAdmin
      .from('modulos')
      .select('id, nome_exibicao')
      .eq('codigo', 'costura')
      .single();

    if (moduloError) {
      throw new Error(`Erro ao buscar módulo Costura: ${moduloError.message}`);
    }

    console.log(`✅ Módulo encontrado: ${moduloCostura.nome_exibicao} (ID: ${moduloCostura.id})\n`);

    // 2. Verificar se processo já existe
    const { data: processoExistente } = await supabaseAdmin
      .from('processes')
      .select('id, nome')
      .eq('modulo_id', moduloCostura.id)
      .eq('nome', 'Montagem de gola')
      .single();

    if (processoExistente) {
      console.log(`⚠️  Processo "Montagem de gola" já existe (ID: ${processoExistente.id})`);
      console.log('   Nada foi alterado.\n');
      return;
    }

    // 3. Inserir novo processo
    const { data: novoProcesso, error: insertError } = await supabaseAdmin
      .from('processes')
      .insert({
        nome: 'Montagem de gola',
        modulo_id: moduloCostura.id,
        ativo: true
      })
      .select('id, nome')
      .single();

    if (insertError) {
      throw new Error(`Erro ao inserir processo: ${insertError.message}`);
    }

    console.log('✅ Processo adicionado com sucesso!');
    console.log(`   ID: ${novoProcesso.id}`);
    console.log(`   Nome: ${novoProcesso.nome}`);
    console.log(`   Módulo: Costura (ID: ${moduloCostura.id})\n`);

    // 4. Listar todos os processos de Costura
    const { data: todosProcessos, error: listError } = await supabaseAdmin
      .from('processes')
      .select('id, nome')
      .eq('modulo_id', moduloCostura.id)
      .eq('ativo', true)
      .order('nome');

    if (listError) {
      throw new Error(`Erro ao listar processos: ${listError.message}`);
    }

    console.log('📋 Processos de Costura (atualizado):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    todosProcessos.forEach((proc, index) => {
      console.log(`${index + 1}. ${proc.nome}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n✅ Total de processos: ${todosProcessos.length}\n`);

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar
adicionarProcesso()
  .then(() => {
    console.log('👋 Script finalizado!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
