// =====================================================
// ALTERAR PIN: ANDRE001 → 220586
// =====================================================

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('./src/config/supabase');

async function alterarPin() {
  try {
    console.log('🔐 Alterando PIN da matrícula ANDRE001...\n');

    const matricula = 'ANDRE001';
    const novoPin = '220586';

    // 1. Buscar usuário
    const { data: user, error: findError } = await supabaseAdmin
      .from('users')
      .select('id, nome, matricula')
      .eq('matricula', matricula)
      .single();

    if (findError || !user) {
      console.error(`❌ Usuário ${matricula} não encontrado`);
      process.exit(1);
    }

    console.log(`✅ Usuário encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.nome}`);
    console.log(`   Matrícula: ${user.matricula}\n`);

    // 2. Gerar hash do novo PIN
    const pin_hash = await bcrypt.hash(novoPin, 10);

    // 3. Atualizar PIN
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ pin_hash })
      .eq('id', user.id);

    if (updateError) {
      console.error(`❌ Erro ao atualizar PIN:`, updateError.message);
      process.exit(1);
    }

    console.log('✅ PIN atualizado com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Matrícula: ${matricula}`);
    console.log(`   Novo PIN: ${novoPin}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar
alterarPin()
  .then(() => {
    console.log('👋 Script finalizado!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
