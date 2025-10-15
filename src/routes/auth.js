// =====================================================
// ROTAS DE AUTENTICAÇÃO
// =====================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');

// =====================================================
// MIDDLEWARE DE VALIDAÇÃO
// =====================================================

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

// =====================================================
// POST /api/auth/login
// Login com matrícula + PIN
// =====================================================

router.post('/login',
  [
    body('matricula').notEmpty().withMessage('Matrícula é obrigatória'),
    body('pin').isLength({ min: 6, max: 6 }).withMessage('PIN deve ter 6 dígitos')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      console.log('🔐 === TENTATIVA DE LOGIN ===');
      console.log('📥 Request body:', JSON.stringify(req.body, null, 2));

      const { pin } = req.body;
      const matricula = req.body.matricula.toUpperCase(); // Sempre maiúscula

      console.log('🔍 Matrícula (uppercase):', matricula);
      console.log('🔍 PIN recebido:', pin);
      console.log('🔍 PIN length:', pin ? pin.length : 0);

      // 1. Buscar usuário por matrícula
      console.log('🔍 Buscando usuário no banco...');
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, nome, matricula, email, pin_hash, perfil, ativo')
        .eq('matricula', matricula)
        .single();

      if (userError) {
        console.error('❌ Erro ao buscar usuário:', userError);
        return res.status(401).json({
          success: false,
          message: 'Matrícula ou PIN inválidos'
        });
      }

      if (!user) {
        console.log('❌ Usuário não encontrado');
        return res.status(401).json({
          success: false,
          message: 'Matrícula ou PIN inválidos'
        });
      }

      console.log('✅ Usuário encontrado:', {
        id: user.id,
        nome: user.nome,
        matricula: user.matricula,
        perfil: user.perfil,
        ativo: user.ativo,
        pin_hash_length: user.pin_hash ? user.pin_hash.length : 0
      });

      // 2. Verificar se usuário está ativo
      if (!user.ativo) {
        console.log('❌ Usuário inativo');
        return res.status(403).json({
          success: false,
          message: 'Usuário inativo. Contate o administrador.'
        });
      }

      // 3. Verificar PIN
      console.log('🔐 Comparando PIN...');
      console.log('   - PIN informado:', pin);
      console.log('   - PIN hash no banco:', user.pin_hash);

      const pinValido = await bcrypt.compare(pin, user.pin_hash);
      console.log('🔐 Resultado bcrypt.compare:', pinValido);

      if (!pinValido) {
        console.log('❌ PIN inválido!');
        return res.status(401).json({
          success: false,
          message: 'Matrícula ou PIN inválidos'
        });
      }

      console.log('✅ PIN válido!');

      // 4. Gerar JWT
      console.log('🔑 Gerando JWT token...');
      const token = jwt.sign(
        {
          id: user.id,
          matricula: user.matricula,
          perfil: user.perfil
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
      );

      console.log('✅ Token gerado com sucesso');

      // 5. Retornar dados do usuário + token
      const response = {
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: {
            id: user.id,
            nome: user.nome,
            matricula: user.matricula,
            email: user.email,
            perfil: user.perfil
          },
          token
        }
      };

      console.log('📤 Enviando resposta de sucesso');
      console.log('📤 User data:', response.data.user);
      res.json(response);

    } catch (error) {
      console.error('❌ ERRO FATAL NO LOGIN:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Erro ao realizar login',
        error: error.message
      });
    }
  }
);

// =====================================================
// POST /api/auth/register
// Criar novo usuário (apenas admin)
// =====================================================

router.post('/register',
  [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('matricula').notEmpty().withMessage('Matrícula é obrigatória'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('pin').isLength({ min: 6, max: 6 }).withMessage('PIN deve ter 6 dígitos'),
    body('perfil').isIn(['colaborador', 'gestor', 'admin', 'cfo']).withMessage('Perfil inválido')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { nome, email, pin, perfil } = req.body;
      const matricula = req.body.matricula.toUpperCase(); // Sempre maiúscula

      // 1. Verificar se matrícula já existe
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('matricula', matricula)
        .single();

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Matrícula já cadastrada'
        });
      }

      // 2. Hash do PIN
      const pin_hash = await bcrypt.hash(pin, 10);

      // 3. Criar usuário
      const { data: user, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          nome,
          matricula,
          email,
          pin_hash,
          perfil,
          ativo: true
        })
        .select('id, nome, matricula, email, perfil')
        .single();

      if (createError) {
        throw createError;
      }

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: user
      });

    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar usuário',
        error: error.message
      });
    }
  }
);

// =====================================================
// POST /api/auth/change-pin
// Alterar PIN (usuário logado)
// =====================================================

router.post('/change-pin',
  [
    body('old_pin').isLength({ min: 6, max: 6 }),
    body('new_pin').isLength({ min: 6, max: 6 }),
    body('user_id').isUUID()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { old_pin, new_pin, user_id } = req.body;

      // 1. Buscar usuário
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, pin_hash')
        .eq('id', user_id)
        .single();

      if (userError || !user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // 2. Verificar PIN antigo
      const pinValido = await bcrypt.compare(old_pin, user.pin_hash);
      if (!pinValido) {
        return res.status(401).json({
          success: false,
          message: 'PIN atual inválido'
        });
      }

      // 3. Hash do novo PIN
      const new_pin_hash = await bcrypt.hash(new_pin, 10);

      // 4. Atualizar PIN
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ pin_hash: new_pin_hash })
        .eq('id', user_id);

      if (updateError) {
        throw updateError;
      }

      res.json({
        success: true,
        message: 'PIN alterado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao alterar PIN:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao alterar PIN',
        error: error.message
      });
    }
  }
);

module.exports = router;