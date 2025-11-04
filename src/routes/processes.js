const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middlewares/auth');

// Listar processos ativos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { modulo_id } = req.query;

    let query = supabaseAdmin
      .from('processes')
      .select('*')
      .eq('ativo', true);

    // Filtrar por módulo se fornecido
    if (modulo_id) {
      query = query.eq('modulo_id', modulo_id);
      console.log(`🔍 Filtrando processos por modulo_id: ${modulo_id}`);
    }

    const { data, error } = await query.order('nome');

    if (error) throw error;

    console.log(`✅ ${data.length} processos encontrados`);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;