const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');

// TODO: Implementar analytics
router.get('/summary', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Analytics (em desenvolvimento)' });
});

module.exports = router;