const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middlewares/auth');
const { body, validationResult, param } = require('express-validator');
const multer = require('multer');
const pdfParse = require('pdf-parse');

// Configuração do multer para upload de PDF
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'));
    }
  }
});

// Listar OFs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabaseAdmin.from('ofs').select('*');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Criar OF
router.post('/',
  authenticateToken,
  requireRole('admin', 'gestor'),
  [
    body('codigo').notEmpty(),
    body('quantidade').isInt({ min: 1 }),
    body('referencia').optional(),
    body('descricao').optional()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { codigo, quantidade, referencia, descricao } = req.body;

      const insertData = {
        codigo,
        quantidade,
        status: 'aberta'
      };

      if (referencia) insertData.referencia = referencia;
      if (descricao) insertData.descricao = descricao;

      const { data, error } = await supabaseAdmin
        .from('ofs')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// Atualizar OF
router.put('/:id',
  authenticateToken,
  requireRole('admin', 'gestor'),
  [
    param('id').isUUID(),
    body('codigo').optional().notEmpty(),
    body('quantidade').optional().isInt({ min: 1 }),
    body('referencia').optional(),
    body('descricao').optional()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { codigo, quantidade, referencia, descricao } = req.body;

      // Verificar se OF existe
      const { data: existing, error: findError } = await supabaseAdmin
        .from('ofs')
        .select('*')
        .eq('id', id)
        .single();

      if (findError || !existing) {
        return res.status(404).json({
          success: false,
          message: 'OF não encontrada'
        });
      }

      // Atualizar
      const updateData = {};
      if (codigo) updateData.codigo = codigo;
      if (quantidade) updateData.quantidade = quantidade;
      if (referencia !== undefined) updateData.referencia = referencia;
      if (descricao !== undefined) updateData.descricao = descricao;

      const { data, error } = await supabaseAdmin
        .from('ofs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, data });

    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// Deletar OF
router.delete('/:id',
  authenticateToken,
  requireRole('admin', 'gestor'),
  [
    param('id').isUUID()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { id } = req.params;

      // Verificar se OF existe
      const { data: existing, error: findError } = await supabaseAdmin
        .from('ofs')
        .select('*')
        .eq('id', id)
        .single();

      if (findError || !existing) {
        return res.status(404).json({ 
          success: false, 
          message: 'OF não encontrada' 
        });
      }

      // Verificar se há atividades associadas
      const { data: activities } = await supabaseAdmin
        .from('activities')
        .select('id')
        .eq('of_id', id)
        .limit(1);

      if (activities && activities.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Não é possível deletar OF com atividades associadas' 
        });
      }

      // Deletar
      const { error } = await supabaseAdmin
        .from('ofs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({ success: true, message: 'OF deletada com sucesso' });

    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// Importar OFs de PDF
router.post('/import-pdf',
  authenticateToken,
  requireRole('admin', 'gestor'),
  upload.single('pdf'),
  async (req, res) => {
    try {
      console.log('🔍 Iniciando processamento de PDF...');

      if (!req.file) {
        console.log('❌ Nenhum arquivo recebido');
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo enviado'
        });
      }

      console.log(`📄 Arquivo recebido: ${req.file.originalname} (${req.file.size} bytes)`);

      // Extrair texto do PDF
      console.log('📖 Extraindo texto do PDF...');

      const data = await pdfParse(req.file.buffer);
      const text = data.text;

      console.log(`✅ Texto extraído com sucesso! ${text.length} caracteres`);
      console.log('📄 PDF recebido, extraindo OFs...');
      console.log('Primeiras 800 caracteres:');
      console.log(text.substring(0, 800));

      // Regex para encontrar linhas com OF e quantidade
      // Formato: 011079   02674ATIVOJAQUETA...277
      // Captura: OF (6 dígitos), Referência (5 dígitos), Descrição e Quantidade (no final da linha)
      const lines = text.split('\n');
      const ofsEncontradas = [];
      const erros = [];

      for (const line of lines) {
        // Procurar linhas que começam com 6 dígitos (OF), seguido de referência,
        // depois ATIVO, descrição e quantidade no final (1-4 dígitos)
        const match = line.match(/^(\d{6})\s+(\d{5})ATIVO(.+?)(\d{1,4})$/);

        if (match) {
          const codigo = match[1];
          const referencia = match[2];
          const descricao = match[3].trim();
          const quantidade = parseInt(match[4]);

          // Validar
          if (codigo && quantidade > 0) {
            // Verificar se OF já existe
            const { data: existing } = await supabaseAdmin
              .from('ofs')
              .select('id, codigo')
              .eq('codigo', codigo)
              .maybeSingle();

            if (existing) {
              erros.push({
                codigo,
                referencia,
                descricao,
                quantidade,
                motivo: 'OF já existe no sistema'
              });
            } else {
              ofsEncontradas.push({
                codigo,
                referencia,
                descricao,
                quantidade
              });
            }
          }
        }
      }

      console.log(`✅ ${ofsEncontradas.length} OFs encontradas`);
      console.log(`⚠️ ${erros.length} OFs ignoradas (duplicadas)`);

      res.json({
        success: true,
        data: {
          ofsEncontradas,
          erros,
          total: ofsEncontradas.length + erros.length
        }
      });

    } catch (error) {
      console.error('❌ Erro ao processar PDF:');
      console.error('Tipo do erro:', error.name);
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);

      res.status(500).json({
        success: false,
        message: 'Erro ao processar PDF',
        error: error.message,
        errorType: error.name
      });
    }
  }
);

// Confirmar importação em lote
router.post('/import-confirm',
  authenticateToken,
  requireRole('admin', 'gestor'),
  [
    body('ofs').isArray().withMessage('ofs deve ser um array'),
    body('ofs.*.codigo').notEmpty(),
    body('ofs.*.quantidade').isInt({ min: 1 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { ofs } = req.body;

      console.log(`📦 Importando ${ofs.length} OFs em lote...`);

      const ofsCriadas = [];
      const erros = [];

      for (const of of ofs) {
        try {
          const insertData = {
            codigo: of.codigo,
            quantidade: of.quantidade,
            status: 'aberta'
          };

          if (of.referencia) insertData.referencia = of.referencia;
          if (of.descricao) insertData.descricao = of.descricao;

          const { data, error } = await supabaseAdmin
            .from('ofs')
            .insert(insertData)
            .select()
            .single();

          if (error) throw error;

          ofsCriadas.push(data);
        } catch (error) {
          erros.push({
            codigo: of.codigo,
            motivo: error.message
          });
        }
      }

      console.log(`✅ ${ofsCriadas.length} OFs criadas com sucesso`);
      console.log(`❌ ${erros.length} OFs com erro`);

      res.json({
        success: true,
        data: {
          criadas: ofsCriadas.length,
          erros: erros.length,
          detalhes: { ofsCriadas, erros }
        }
      });

    } catch (error) {
      console.error('❌ Erro na importação:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;