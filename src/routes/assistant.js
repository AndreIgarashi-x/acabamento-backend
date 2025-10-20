// =====================================================
// ROTAS DO ASSISTENTE IA
// =====================================================

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middlewares/auth');
const { processUserQuery } = require('../services/gptAssistant');

// =====================================================
// POST /api/assistant/query
// Processar pergunta em linguagem natural
// =====================================================

router.post('/query',
  authenticateToken,
  [
    body('query')
      .notEmpty().withMessage('Pergunta é obrigatória')
      .isString().withMessage('Pergunta deve ser texto')
      .isLength({ min: 3, max: 500 }).withMessage('Pergunta deve ter entre 3 e 500 caracteres')
  ],
  async (req, res) => {
    // Validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Pergunta inválida',
        errors: errors.array()
      });
    }

    try {
      const { query } = req.body;
      const userId = req.user.id;
      const userName = req.user.nome || 'Usuário';

      console.log('🔍 === ASSISTENTE IA ===');
      console.log('👤 Usuário:', userName);
      console.log('❓ Pergunta:', query);

      // Verificar se OpenAI está configurada
      if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY não configurada');
        return res.status(503).json({
          success: false,
          message: 'Assistente IA não configurado. Entre em contato com o administrador.'
        });
      }

      // Processar pergunta com o assistente
      const result = await processUserQuery(query);

      if (result.success) {
        console.log('✅ Resposta gerada com sucesso');
        console.log('📝 Resposta:', result.response);

        res.json({
          success: true,
          response: result.response,
          debug: process.env.NODE_ENV === 'development' ? result.debug : undefined
        });
      } else {
        console.error('❌ Erro ao processar pergunta:', result.error);

        res.status(500).json({
          success: false,
          message: result.response || 'Não consegui processar sua pergunta.',
          error: process.env.NODE_ENV === 'development' ? result.error : undefined
        });
      }

    } catch (error) {
      console.error('❌ ERRO FATAL NO ASSISTENTE:', error);
      console.error('Stack trace:', error.stack);

      res.status(500).json({
        success: false,
        message: 'Ocorreu um erro ao processar sua pergunta. Tente novamente.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// =====================================================
// GET /api/assistant/examples
// Listar exemplos de perguntas
// =====================================================

router.get('/examples', authenticateToken, (req, res) => {
  res.json({
    success: true,
    examples: [
      {
        categoria: 'Consultar OFs',
        perguntas: [
          'Qual o status da OF 011593?',
          'Quais OFs estão abertas?',
          'Me fale sobre a ordem 011079',
          'Resumo da OF 011593'
        ]
      },
      {
        categoria: 'Atividades e Produção',
        perguntas: [
          'Quem trabalhou na OF 011593?',
          'Quem caseou a ordem 011593?',
          'Quantas peças João produziu hoje?',
          'Produção de Maria esta semana'
        ]
      },
      {
        categoria: 'Desempenho',
        perguntas: [
          'Quem produziu mais hoje?',
          'Ranking de produção da semana',
          'Quanto tempo leva para casear?',
          'Tempo médio de caseamento na OF 011593'
        ]
      },
      {
        categoria: 'Processos',
        perguntas: [
          'Quantas peças foram caseadas hoje?',
          'Quem está pregando botões?',
          'Lista de atividades de revisão'
        ]
      }
    ]
  });
});

// =====================================================
// GET /api/assistant/health
// Verificar status do assistente
// =====================================================

router.get('/health', authenticateToken, (req, res) => {
  const isConfigured = !!process.env.OPENAI_API_KEY;

  res.json({
    success: true,
    status: isConfigured ? 'online' : 'not_configured',
    message: isConfigured
      ? 'Assistente IA está online e pronto para usar'
      : 'Assistente IA não está configurado (OPENAI_API_KEY ausente)',
    configured: isConfigured
  });
});

module.exports = router;
