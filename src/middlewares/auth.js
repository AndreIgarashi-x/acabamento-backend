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

  console.log('🔐 Auth Header:', authHeader ? 'Present' : 'Missing');
  console.log('🔑 Token:', token ? 'Present' : 'Missing');

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({
      success: false,
      message: 'Token não fornecido'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Token verification failed:', err.message);
      console.log('🔑 JWT_SECRET defined:', !!process.env.JWT_SECRET);
      return res.status(403).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    console.log('✅ Token verified for user:', user.nome);
    req.user = user; // Adiciona dados do usuário ao request
    next();
  });
};

// =====================================================
// Verificar perfil de acesso
// =====================================================

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    console.log('🔒 === VERIFICANDO PERMISSÃO ===');
    console.log('👤 User:', req.user);
    console.log('🎭 Allowed roles:', allowedRoles);

    if (!req.user) {
      console.log('❌ Usuário não autenticado (req.user está vazio)');
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    console.log('🎭 User perfil:', req.user.perfil);
    console.log('✅ Role includes?', allowedRoles.includes(req.user.perfil));

    if (!allowedRoles.includes(req.user.perfil)) {
      console.log('❌ Acesso negado! Perfil não permitido.');
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissão insuficiente.',
        required: allowedRoles,
        current: req.user.perfil
      });
    }

    console.log('✅ Permissão OK! Prosseguindo...');
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};