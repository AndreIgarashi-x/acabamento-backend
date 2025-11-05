// =====================================================
// CRIAR USUÁRIO DEMO/TESTE
// =====================================================

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('./src/config/supabase');

async function criarUsuarioDemo() {
  try {
    console.log('🚀 Criando usuário DEMO...\n');

    const matricula = 'DEMO.TESTE';
    const pin = '123456';
    const nome = 'Usuário Demonstração';

    // 1. Verificar se já existe
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id, nome')
      .eq('matricula', matricula)
      .single();

    if (existing) {
      console.log(`⚠️  Usuário ${matricula} já existe (ID: ${existing.id})`);
      console.log('   Nada foi alterado.\n');
      return;
    }

    // 2. Hash do PIN
    const pin_hash = await bcrypt.hash(pin, 10);

    // 3. Inserir no banco
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        nome: nome,
        matricula: matricula,
        pin_hash: pin_hash,
        perfil: 'colaborador',
        ativo: true,
        modulos_permitidos: ['acabamento', 'costura', 'estampas']
      })
      .select('id, nome, matricula, perfil')
      .single();

    if (error) {
      console.error(`❌ Erro ao criar usuário:`, error.message);
      process.exit(1);
    }

    console.log('✅ Usuário DEMO criado com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   ID: ${data.id}`);
    console.log(`   Nome: ${data.nome}`);
    console.log(`   Matrícula: ${data.matricula}`);
    console.log(`   PIN: ${pin}`);
    console.log(`   Perfil: ${data.perfil}`);
    console.log(`   Módulos: acabamento, costura, estampas`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⚠️  IMPORTANTE:');
    console.log('   Este usuário é para DEMONSTRAÇÃO.');
    console.log('   As atividades deste usuário NÃO serão gravadas no banco.');
    console.log('   Ideal para mostrar o sistema sem poluir os dados.\n');

    console.log('🔐 Credenciais para demonstração:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Matrícula: ${matricula}`);
    console.log(`   PIN: ${pin}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar
criarUsuarioDemo()
  .then(() => {
    console.log('👋 Script finalizado!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
