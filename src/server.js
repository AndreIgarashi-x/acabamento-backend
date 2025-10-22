// =====================================================
// SERVER.JS - Servidor Principal
// App Cronometragem Acabamento - DCJ Uniformes
// =====================================================

console.log('🔍 Iniciando servidor...');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const processRoutes = require('./routes/processes');
const ofRoutes = require('./routes/ofs');
const activityRoutes = require('./routes/activities');
const dashboardRoutes = require('./routes/dashboard');
const analyticsRoutes = require('./routes/analytics');
const reportRoutes = require('./routes/reports');
const assistantRoutes = require('./routes/assistant');

// Middlewares customizados
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// MIDDLEWARES GLOBAIS
// =====================================================

// Trust proxy (necessário para Railway, Heroku, etc.)
app.set('trust proxy', 1);

// Segurança
app.use(helmet());

// CORS (ajustar origins em produção)
const allowedOrigins = [
  'http://localhost:5173',
  'https://acabamento-frontend.vercel.app'
];

// Adicionar FRONTEND_URL se definido
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Compressão de respostas
app.use(compression());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logs
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Muitas requisições deste IP, tente novamente em 15 minutos.'
});

app.use('/api/', limiter);

// Rate limiting específico para operações críticas
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 requests por minuto
  message: 'Limite de requisições excedido para esta operação.'
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// =====================================================
// ROTAS DA API
// =====================================================

// Autenticação
app.use('/api/auth', authRoutes);

// Usuários
app.use('/api/users', userRoutes);

// Processos
app.use('/api/processes', processRoutes);

// OFs
app.use('/api/ofs', ofRoutes);

// Atividades (cronometragem)
// Rate limiting específico aplicado individualmente em /start e /finish dentro de activities.js
app.use('/api/activities', activityRoutes);

// Dashboard (tempo real)
app.use('/api/dashboard', dashboardRoutes);

// Analytics (relatórios e KPIs)
app.use('/api/analytics', analyticsRoutes);

// Relatórios
app.use('/api/reports', reportRoutes);

// Assistente IA
app.use('/api/assistant', assistantRoutes);

// =====================================================
// ROTA 404
// =====================================================

app.use( (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// =====================================================
// ERROR HANDLER GLOBAL
// =====================================================

app.use(errorHandler);

// =====================================================
// INICIAR SERVIDOR
// =====================================================

app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
  logger.info(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`\n✅ API disponível em: http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido. Encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recebido. Encerrando servidor...');
  process.exit(0);
});

module.exports = app;