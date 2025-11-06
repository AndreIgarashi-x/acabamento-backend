// =====================================================
// REMOVER BORDADEIRAS ANTIGAS (BORDADEIRA-01 e BORDADEIRA-02)
// Manter apenas BORD-01 e BORD-02
// =====================================================

require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function removerBordadeirasAntigas() {
  try {
    console.log('🗑️  Removendo bordadeiras antigas...\n');

    const codigosRemover = ['BORDADEIRA-01', 'BORDADEIRA-02'];

    for (const codigo of codigosRemover) {
      // 1. Buscar máquina
      const { data: machine, error: findError } = await supabaseAdmin
        .from('machines')
        .select('id, codigo, nome')
        .eq('codigo', codigo)
        .single();

      if (findError || !machine) {
        console.log(`⏩ ${codigo} não encontrada, pulando...`);
        continue;
      }

      console.log(`📍 Encontrada: ${machine.nome} (ID: ${machine.id})`);

      // 2. Verificar se tem atividades associadas
      const { data: activities, error: activitiesError } = await supabaseAdmin
        .from('activities')
        .select('id')
        .eq('machine_id', machine.id)
        .limit(1);

      if (activitiesError) {
        console.error(`❌ Erro ao verificar atividades: ${activitiesError.message}`);
        continue;
      }

      if (activities && activities.length > 0) {
        console.log(`⚠️  ${codigo} tem atividades associadas. NÃO será removida.`);
        console.log(`   Você precisará remover manualmente ou manter no sistema.\n`);
        continue;
      }

      // 3. Remover cabeças da máquina
      const { error: headsError } = await supabaseAdmin
        .from('machine_heads')
        .delete()
        .eq('machine_id', machine.id);

      if (headsError) {
        console.error(`❌ Erro ao remover cabeças: ${headsError.message}`);
        continue;
      }

      console.log(`   ✅ Cabeças removidas`);

      // 4. Remover máquina
      const { error: deleteError } = await supabaseAdmin
        .from('machines')
        .delete()
        .eq('id', machine.id);

      if (deleteError) {
        console.error(`❌ Erro ao remover máquina: ${deleteError.message}`);
        continue;
      }

      console.log(`   ✅ Máquina ${codigo} removida com sucesso!\n`);
    }

    // 5. Listar máquinas restantes do módulo Estampas
    const { data: todasMaquinas, error: listError } = await supabaseAdmin
      .from('machines')
      .select('id, codigo, nome, tipo, num_cabecas')
      .eq('modulo_id', 2) // Módulo Estampas
      .order('codigo');

    if (listError) {
      throw new Error(`Erro ao listar máquinas: ${listError.message}`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🪡 Máquinas do Módulo Estampas (lista atualizada):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    todasMaquinas.forEach((maq, index) => {
      console.log(`${index + 1}. ${maq.codigo} - ${maq.nome} (${maq.num_cabecas} cabeças) [${maq.tipo}]`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n✅ Total de máquinas no módulo Estampas: ${todasMaquinas.length}\n`);

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar
removerBordadeirasAntigas()
  .then(() => {
    console.log('👋 Script finalizado!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
