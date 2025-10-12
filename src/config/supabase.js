// =====================================================
// CLIENTE SUPABASE
// =====================================================

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Para backend, SERVICE_KEY é obrigatória (bypass RLS)
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente faltando!');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅ OK' : '❌ FALTANDO');
  console.error('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✅ OK' : '❌ FALTANDO');
  console.error('SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ OK' : '❌ FALTANDO');
  throw new Error('Variáveis SUPABASE_URL e pelo menos uma chave são obrigatórias');
}

// Cliente admin com Service Key (bypass RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Cliente público com Anon Key (usa RLS) - se disponível
const supabasePublic = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false
      }
    })
  : supabaseAdmin;

module.exports = {
  supabaseAdmin,
  supabasePublic
};