// =====================================================
// ADICIONAR PROCESSOS: Colocação de revel + Aplicação de Elástico (Costura)
// =====================================================

require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function adicionarProcessos() {
  try {
    console.log('🚀 Adicionando processos ao módulo Costura...\n');

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

    // 2. Processos a adicionar
    const novosProcessos = [
      'Colocação de revel',
      'Aplicação de Elástico'
    ];

    console.log('📝 Processos a adicionar:');
    novosProcessos.forEach((nome, index) => {
      console.log(`   ${index + 1}. ${nome}`);
    });
    console.log('');

    // 3. Adicionar cada processo
    let adicionados = 0;
    let jaExistentes = 0;

    for (const nomeProcesso of novosProcessos) {
      // Verificar se já existe
      const { data: processoExistente } = await supabaseAdmin
        .from('processes')
        .select('id, nome')
        .eq('modulo_id', moduloCostura.id)
        .eq('nome', nomeProcesso)
        .single();

      if (processoExistente) {
        console.log(`⏩ "${nomeProcesso}" já existe (ID: ${processoExistente.id})`);
        jaExistentes++;
        continue;
      }

      // Inserir novo processo
      const { data: novoProcesso, error: insertError } = await supabaseAdmin
        .from('processes')
        .insert({
          nome: nomeProcesso,
          modulo_id: moduloCostura.id,
          ativo: true
        })
        .select('id, nome')
        .single();

      if (insertError) {
        console.error(`❌ Erro ao inserir "${nomeProcesso}": ${insertError.message}`);
        continue;
      }

      console.log(`✅ "${nomeProcesso}" adicionado (ID: ${novoProcesso.id})`);
      adicionados++;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Resumo:`);
    console.log(`   ✅ Adicionados: ${adicionados}`);
    console.log(`   ⏩ Já existentes: ${jaExistentes}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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

    console.log('📋 Processos de Costura (lista completa atualizada):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    todosProcessos.forEach((proc, index) => {
      const isNovo = novosProcessos.includes(proc.nome);
      const marcador = isNovo ? '⭐' : '  ';
      console.log(`${marcador} ${index + 1}. ${proc.nome}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n✅ Total de processos: ${todosProcessos.length}\n`);

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar
adicionarProcessos()
  .then(() => {
    console.log('👋 Script finalizado!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
