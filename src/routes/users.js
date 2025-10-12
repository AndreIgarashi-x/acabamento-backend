const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');

// TODO: Implementar rotas de usuários
router.get('/', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Rota de usuários (em desenvolvimento)' });
});

module.exports = router;