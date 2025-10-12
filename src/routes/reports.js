const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');

// TODO: Implementar relatórios
router.get('/', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Relatórios (em desenvolvimento)' });
});

module.exports = router;