// =====================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// =====================================================

const jwt = require('jsonwebtoken');

// =====================================================
// Verificar token JWT
// =====================================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token não fornecido'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    req.user = user; // Adiciona dados do usuário ao request
    next();
  });
};

// =====================================================
// Verificar perfil de acesso
// =====================================================

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    if (!allowedRoles.includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissão insuficiente.'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};