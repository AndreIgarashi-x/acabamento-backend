// =====================================================
// Script para excluir atividades de um usuário específico
// =====================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { supabaseAdmin } = require('../config/supabase');

const USUARIO_NOME = 'Andre Jesus'; // Nome do usuário para buscar

async function deleteUserActivities() {
  try {
    console.log('🔍 Iniciando processo de exclusão...');
    console.log('=' .repeat(60));

    // 1. Buscar o usuário pelo nome
    console.log(`\n1️⃣ Buscando usuário: "${USUARIO_NOME}"`);

    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, nome, matricula')
      .ilike('nome', `%${USUARIO_NOME}%`);

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ Nenhum usuário encontrado com esse nome');
      return;
    }

    console.log(`\n✅ Usuário(s) encontrado(s):`);
    users.forEach((user, idx) => {
      console.log(`   ${idx + 1}. ${user.nome} (Matrícula: ${user.matricula}) - ID: ${user.id}`);
    });

    // Se houver múltiplos usuários, use o primeiro
    const userId = users[0].id;
    const userName = users[0].nome;

    console.log(`\n📌 Usando: ${userName} (ID: ${userId})`);
    console.log('=' .repeat(60));

    // 2. Buscar todas as atividades do usuário
    console.log(`\n2️⃣ Buscando atividades do usuário...`);

    const { data: activities, error: activitiesError } = await supabaseAdmin
      .from('activities')
      .select('id, status, ts_inicio, qty_planejada, qty_realizada, processes(nome), ofs(codigo)')
      .eq('user_id', userId)
      .order('ts_inicio', { ascending: false });

    if (activitiesError) {
      console.error('❌ Erro ao buscar atividades:', activitiesError);
      return;
    }

    if (!activities || activities.length === 0) {
      console.log('✅ Nenhuma atividade encontrada para este usuário');
      console.log('=' .repeat(60));
      return;
    }

    console.log(`\n✅ ${activities.length} atividade(s) encontrada(s):`);
    activities.forEach((act, idx) => {
      const data = new Date(act.ts_inicio).toLocaleDateString('pt-BR');
      console.log(`   ${idx + 1}. ${data} - ${act.processes?.nome || 'N/A'} - OF: ${act.ofs?.codigo || 'N/A'} - Status: ${act.status}`);
    });

    // 3. Buscar peças registradas
    const activityIds = activities.map(a => a.id);

    console.log(`\n3️⃣ Buscando peças registradas...`);

    const { data: pecas, error: pecasError } = await supabaseAdmin
      .from('pecas_registradas')
      .select('id')
      .in('atividade_id', activityIds);

    if (pecasError) {
      console.error('❌ Erro ao buscar peças:', pecasError);
      return;
    }

    const totalPecas = pecas?.length || 0;
    console.log(`✅ ${totalPecas} peça(s) registrada(s) encontrada(s)`);

    // 4. Confirmação
    console.log('\n' + '=' .repeat(60));
    console.log('⚠️  RESUMO DA EXCLUSÃO:');
    console.log('=' .repeat(60));
    console.log(`👤 Usuário: ${userName}`);
    console.log(`🗑️  Atividades a excluir: ${activities.length}`);
    console.log(`📦 Peças registradas a excluir: ${totalPecas}`);
    console.log('=' .repeat(60));

    console.log('\n⏳ Aguarde 3 segundos para cancelar (Ctrl+C)...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 5. Excluir peças registradas primeiro (relação FK)
    if (totalPecas > 0) {
      console.log(`\n4️⃣ Excluindo ${totalPecas} peça(s) registrada(s)...`);

      const { error: deletePecasError } = await supabaseAdmin
        .from('pecas_registradas')
        .delete()
        .in('atividade_id', activityIds);

      if (deletePecasError) {
        console.error('❌ Erro ao excluir peças:', deletePecasError);
        return;
      }

      console.log('✅ Peças excluídas com sucesso!');
    }

    // 6. Excluir atividades
    console.log(`\n5️⃣ Excluindo ${activities.length} atividade(s)...`);

    const { error: deleteActivitiesError } = await supabaseAdmin
      .from('activities')
      .delete()
      .in('id', activityIds);

    if (deleteActivitiesError) {
      console.error('❌ Erro ao excluir atividades:', deleteActivitiesError);
      return;
    }

    console.log('✅ Atividades excluídas com sucesso!');

    // 7. Verificação final
    console.log('\n6️⃣ Verificação final...');

    const { data: remaining, error: verifyError } = await supabaseAdmin
      .from('activities')
      .select('id')
      .eq('user_id', userId);

    if (verifyError) {
      console.error('⚠️ Erro na verificação:', verifyError);
    } else {
      const remainingCount = remaining?.length || 0;
      if (remainingCount === 0) {
        console.log('✅ Todas as atividades foram excluídas!');
      } else {
        console.log(`⚠️ Ainda restam ${remainingCount} atividade(s)`);
      }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('✅ PROCESSO CONCLUÍDO COM SUCESSO!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ ERRO GERAL:', error);
    console.error(error.stack);
  }
}

// Executar
deleteUserActivities()
  .then(() => {
    console.log('\n👋 Finalizando...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
