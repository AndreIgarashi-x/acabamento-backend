// =====================================================
// Script para Verificar Usuário e Hash do PIN
// =====================================================

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyUser() {
  try {
    const matricula = 'ANDRE001';
    const pinToTest = '123456';

    console.log('🔍 Buscando usuário ANDRE001...\n');

    // 1. Buscar usuário
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('matricula', matricula)
      .maybeSingle();

    if (findError) {
      console.error('❌ Erro ao buscar usuário:', findError);
      process.exit(1);
    }

    if (!user) {
      console.error('❌ Usuário não encontrado!');
      process.exit(1);
    }

    // 2. Mostrar dados do usuário
    console.log('📋 DADOS DO USUÁRIO:');
    console.log('   - ID:', user.id);
    console.log('   - Nome:', user.nome);
    console.log('   - Matrícula:', user.matricula);
    console.log('   - Email:', user.email);
    console.log('   - Perfil:', user.perfil);
    console.log('   - Ativo:', user.ativo);
    console.log('   - PIN Hash:', user.pin_hash);
    console.log('   - PIN Hash Length:', user.pin_hash ? user.pin_hash.length : 'NULL');

    // 3. Testar hash do PIN
    console.log('\n🔐 TESTANDO HASH DO PIN...');
    console.log('   - PIN a testar:', pinToTest);

    if (!user.pin_hash) {
      console.error('❌ PIN hash está NULL no banco!');
      process.exit(1);
    }

    const isValid = await bcrypt.compare(pinToTest, user.pin_hash);

    console.log('   - bcrypt.compare resultado:', isValid);

    if (isValid) {
      console.log('\n✅ PIN ESTÁ CORRETO! O hash está funcionando.');
    } else {
      console.log('\n❌ PIN NÃO CONFERE! O hash não está correto.');

      // Gerar novo hash para comparação
      console.log('\n🔧 Gerando novo hash para o PIN 123456...');
      const newHash = await bcrypt.hash(pinToTest, 10);
      console.log('   - Novo hash gerado:', newHash);
      console.log('   - Hash atual no banco:', user.pin_hash);

      // Testar novo hash
      const newHashTest = await bcrypt.compare(pinToTest, newHash);
      console.log('   - Teste com novo hash:', newHashTest);
    }

    // 4. Verificar se está ativo
    console.log('\n👤 VERIFICAÇÕES ADICIONAIS:');
    console.log('   - Usuário ativo?', user.ativo ? '✅ SIM' : '❌ NÃO');
    console.log('   - Perfil:', user.perfil);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifyUser()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
