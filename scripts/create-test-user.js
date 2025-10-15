// =====================================================
// Script para Criar Usuário de Teste
// =====================================================

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de que .env existe e contém:');
  console.error('- SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    const matricula = 'ANDRE001';
    const pin = '123456';
    const nome = 'Andre Jesus';
    const email = 'andre@dcjuniformes.com.br';
    const perfil = 'admin'; // admin tem acesso total

    console.log('🔍 Verificando se usuário já existe...');

    // 1. Verificar se usuário já existe
    const { data: existing, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('matricula', matricula)
      .maybeSingle();

    if (findError && findError.code !== 'PGRST116') {
      throw findError;
    }

    if (existing) {
      console.log('⚠️ Usuário já existe!');
      console.log('📋 Dados atuais:');
      console.log('   - ID:', existing.id);
      console.log('   - Nome:', existing.nome);
      console.log('   - Matrícula:', existing.matricula);
      console.log('   - Email:', existing.email);
      console.log('   - Perfil:', existing.perfil);
      console.log('   - Ativo:', existing.ativo);

      // Perguntar se quer atualizar o PIN
      console.log('\n🔄 Atualizando PIN para:', pin);

      const pin_hash = await bcrypt.hash(pin, 10);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          pin_hash,
          nome,
          email,
          perfil,
          ativo: true
        })
        .eq('id', existing.id);

      if (updateError) {
        throw updateError;
      }

      console.log('✅ PIN atualizado com sucesso!');
      console.log('\n📝 Credenciais de Login:');
      console.log('   - Matrícula:', matricula);
      console.log('   - PIN:', pin);

      return;
    }

    // 2. Criar hash do PIN
    console.log('🔐 Gerando hash do PIN...');
    const pin_hash = await bcrypt.hash(pin, 10);

    // 3. Criar usuário
    console.log('✨ Criando novo usuário...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        nome,
        matricula,
        email,
        pin_hash,
        perfil,
        ativo: true
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    console.log('✅ Usuário criado com sucesso!');
    console.log('📋 Dados do novo usuário:');
    console.log('   - ID:', newUser.id);
    console.log('   - Nome:', newUser.nome);
    console.log('   - Matrícula:', newUser.matricula);
    console.log('   - Email:', newUser.email);
    console.log('   - Perfil:', newUser.perfil);

    console.log('\n📝 Credenciais de Login:');
    console.log('   - Matrícula:', matricula);
    console.log('   - PIN:', pin);

  } catch (error) {
    console.error('❌ Erro:', error.message);

    if (error.code === '42P01') {
      console.error('\n⚠️ A tabela "users" não existe no banco de dados!');
      console.error('Execute o script de migração para criar as tabelas.');
    } else if (error.code === '23505') {
      console.error('\n⚠️ Já existe um usuário com essa matrícula ou email.');
    } else {
      console.error('\nDetalhes do erro:', error);
    }

    process.exit(1);
  }
}

// Executar script
console.log('🚀 Iniciando script de criação de usuário...\n');
createTestUser()
  .then(() => {
    console.log('\n✅ Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
