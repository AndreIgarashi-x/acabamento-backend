// =====================================================
// CRIAR 2 MÁQUINAS DE BORDADO COM 15 CABEÇAS CADA
// =====================================================

require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function criarMaquinasBordado() {
  try {
    console.log('🪡 Criando máquinas de bordado...\n');

    // 1. Buscar módulo Estampas
    const { data: modulo, error: moduloError } = await supabaseAdmin
      .from('modulos')
      .select('id, nome_exibicao')
      .eq('codigo', 'estampas')
      .single();

    if (moduloError) {
      throw new Error(`Erro ao buscar módulo: ${moduloError.message}`);
    }

    console.log(`✅ Módulo encontrado: ${modulo.nome_exibicao} (ID: ${modulo.id})\n`);

    // 2. Definir as 2 máquinas
    const maquinas = [
      {
        codigo: 'BORD-01',
        nome: 'Máquina de Bordado 01',
        tipo: 'bordado',
        num_cabecas: 15,
        modulo_id: modulo.id,
        especificacoes: {
          marca: 'Tajima',
          modelo: '15 Cabeças',
          ano: 2020
        }
      },
      {
        codigo: 'BORD-02',
        nome: 'Máquina de Bordado 02',
        tipo: 'bordado',
        num_cabecas: 15,
        modulo_id: modulo.id,
        especificacoes: {
          marca: 'Tajima',
          modelo: '15 Cabeças',
          ano: 2020
        }
      }
    ];

    let criadas = 0;
    let jaExistentes = 0;

    for (const maquinaData of maquinas) {
      // Verificar se já existe
      const { data: existing } = await supabaseAdmin
        .from('machines')
        .select('id, nome')
        .eq('codigo', maquinaData.codigo)
        .single();

      if (existing) {
        console.log(`⏩ ${maquinaData.codigo} já existe (ID: ${existing.id})`);
        jaExistentes++;
        continue;
      }

      // Criar máquina
      const { data: maquina, error: createError } = await supabaseAdmin
        .from('machines')
        .insert({
          codigo: maquinaData.codigo,
          nome: maquinaData.nome,
          tipo: maquinaData.tipo,
          modulo_id: maquinaData.modulo_id,
          num_cabecas: maquinaData.num_cabecas,
          especificacoes: maquinaData.especificacoes,
          status: 'ativa'
        })
        .select()
        .single();

      if (createError) {
        console.error(`❌ Erro ao criar ${maquinaData.codigo}:`, createError.message);
        continue;
      }

      console.log(`✅ Máquina criada: ${maquina.nome} (ID: ${maquina.id})`);

      // Criar as 15 cabeças
      const cabecas = [];
      for (let i = 1; i <= maquinaData.num_cabecas; i++) {
        cabecas.push({
          machine_id: maquina.id,
          numero_cabeca: i,
          status: 'ok'
        });
      }

      const { error: cabecasError } = await supabaseAdmin
        .from('machine_heads')
        .insert(cabecas);

      if (cabecasError) {
        console.error(`❌ Erro ao criar cabeças para ${maquina.nome}:`, cabecasError.message);
      } else {
        console.log(`   ✅ ${maquinaData.num_cabecas} cabeças criadas\n`);
      }

      criadas++;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Resumo:`);
    console.log(`   ✅ Criadas: ${criadas}`);
    console.log(`   ⏩ Já existentes: ${jaExistentes}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Listar todas as máquinas do módulo
    const { data: todasMaquinas, error: listError } = await supabaseAdmin
      .from('machines')
      .select('id, codigo, nome, tipo, num_cabecas, status')
      .eq('modulo_id', modulo.id)
      .order('codigo');

    if (listError) {
      throw new Error(`Erro ao listar máquinas: ${listError.message}`);
    }

    console.log('🪡 Máquinas de Bordado (lista completa):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    todasMaquinas.forEach((maq, index) => {
      const isNova = maquinas.some(m => m.codigo === maq.codigo);
      const marcador = isNova ? '⭐' : '  ';
      console.log(`${marcador} ${index + 1}. ${maq.codigo} - ${maq.nome} (${maq.num_cabecas} cabeças)`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n✅ Total de máquinas: ${todasMaquinas.length}\n`);

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar
criarMaquinasBordado()
  .then(() => {
    console.log('👋 Script finalizado!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
