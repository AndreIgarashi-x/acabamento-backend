// =====================================================
// SCRIPT PARA CRIAR USUÁRIOS
// =====================================================

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('./src/config/supabase');

const usuarios = [
  {
    nome: 'Maria Ilza',
    matricula: 'MARIA.ILZA',
    pin: '123456',
    perfil: 'colaborador'
  },
  {
    nome: 'Aldeniza Carmo',
    matricula: 'ALDENIZA.CARMO',
    pin: '123456',
    perfil: 'colaborador'
  },
  {
    nome: 'Cleide Regina',
    matricula: 'CLEIDE.REGINA',
    pin: '123456',
    perfil: 'colaborador'
  },
  {
    nome: 'Natalia Gomes',
    matricula: 'NATALIA.GOMES',
    pin: '123456',
    perfil: 'colaborador'
  }
];

async function criarUsuarios() {
  console.log('🚀 Iniciando criação de usuários...\n');

  for (const usuario of usuarios) {
    try {
      console.log(`📝 Criando usuário: ${usuario.nome} (${usuario.matricula})`);

      // 1. Verificar se já existe
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id, nome')
        .eq('matricula', usuario.matricula)
        .single();

      if (existing) {
        console.log(`⚠️  Usuário ${usuario.matricula} já existe - pulando\n`);
        continue;
      }

      // 2. Hash do PIN
      const pin_hash = await bcrypt.hash(usuario.pin, 10);

      // 3. Inserir no banco
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
          nome: usuario.nome,
          matricula: usuario.matricula,
          pin_hash: pin_hash,
          perfil: usuario.perfil,
          ativo: true,
          modulos_permitidos: ['acabamento', 'costura', 'estampas']
        })
        .select('id, nome, matricula, perfil')
        .single();

      if (error) {
        console.error(`❌ Erro ao criar ${usuario.matricula}:`, error.message);
        continue;
      }

      console.log(`✅ Usuário criado com sucesso!`);
      console.log(`   ID: ${data.id}`);
      console.log(`   Nome: ${data.nome}`);
      console.log(`   Matrícula: ${data.matricula}`);
      console.log(`   Perfil: ${data.perfil}`);
      console.log(`   PIN: ${usuario.pin}`);
      console.log(`   Módulos: acabamento, costura, estampas\n`);

    } catch (error) {
      console.error(`❌ Erro fatal ao criar ${usuario.matricula}:`, error);
    }
  }

  console.log('✅ Processo concluído!\n');
  console.log('📋 Resumo:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Listar todos os usuários criados
  const { data: allUsers } = await supabaseAdmin
    .from('users')
    .select('nome, matricula, perfil, modulos_permitidos')
    .in('matricula', usuarios.map(u => u.matricula))
    .order('nome');

  if (allUsers) {
    allUsers.forEach(user => {
      console.log(`✓ ${user.nome.padEnd(20)} | ${user.matricula.padEnd(20)} | ${user.perfil}`);
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔑 Todos os PINs: 123456');
}

// Executar
criarUsuarios()
  .then(() => {
    console.log('\n👋 Script finalizado!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
