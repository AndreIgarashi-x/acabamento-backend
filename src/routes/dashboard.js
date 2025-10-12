const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../middlewares/auth');

// Sessões ativas (tempo real)
router.get('/live', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('v_activities_live')
      .select('*');

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;