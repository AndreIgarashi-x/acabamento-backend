// Script para buscar OFs por código
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function searchOfs() {
  try {
    console.log('🔍 Buscando OFs que contém "011537"...\n');

    const { data: ofs, error } = await supabase
      .from('ofs')
      .select('id, codigo, referencia, descricao, status')
      .ilike('codigo', '%011537%')
      .order('codigo', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar OFs:', error);
      return;
    }

    if (!ofs || ofs.length === 0) {
      console.log('⚠️  Nenhuma OF encontrada com código similar a "011537"\n');
      console.log('🔍 Buscando todas as OFs ativas...\n');

      // Buscar OFs ativas recentes
      const { data: ofsAtivas, error: error2 } = await supabase
        .from('ofs')
        .select('id, codigo, referencia, descricao, status')
        .eq('status', 'ativa')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error2) {
        console.error('❌ Erro:', error2);
        return;
      }

      console.log(`📋 Últimas 10 OFs ativas:\n`);
      ofsAtivas.forEach((of, idx) => {
        console.log(`${idx + 1}. ${of.codigo} - ${of.referencia} - ${of.descricao}`);
        console.log(`   ID: ${of.id}`);
        console.log(`   Status: ${of.status}\n`);
      });

      return;
    }

    console.log(`📋 OFs encontradas: ${ofs.length}\n`);
    console.log('='.repeat(80));

    ofs.forEach((of, idx) => {
      console.log(`\n${idx + 1}. ${of.codigo}`);
      console.log(`   Produto: ${of.referencia} - ${of.descricao}`);
      console.log(`   Status: ${of.status}`);
      console.log(`   ID: ${of.id}`);
    });

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

searchOfs();
