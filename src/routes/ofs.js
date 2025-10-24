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

// Listar OFs (com contagem de atividades)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;

    // Buscar OFs
    let query = supabaseAdmin.from('ofs').select('*');

    if (status) {
      query = query.eq('status', status);
    }

    const { data: ofs, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Para cada OF, contar atividades
    const ofsComContagem = await Promise.all(
      ofs.map(async (of) => {
        const { count, error: countError } = await supabaseAdmin
          .from('activities')
          .select('*', { count: 'exact', head: true })
          .eq('of_id', of.id);

        if (countError) {
          console.error(`Erro ao contar atividades da OF ${of.codigo}:`, countError);
          return { ...of, total_atividades: 0 };
        }

        return { ...of, total_atividades: count || 0 };
      })
    );

    res.json({ success: true, data: ofsComContagem });
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

// Concluir OF
router.patch('/:id/concluir',
  authenticateToken,
  requireRole('admin'),
  [
    param('id').isUUID()
  ],
  async (req, res) => {
    console.log('🔍 === TENTATIVA DE CONCLUIR OF ===');
    console.log('📥 Params:', req.params);
    console.log('👤 User:', req.user);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Erros de validação:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { id } = req.params;
      console.log('🔍 ID da OF:', id);

      // Verificar se OF existe
      console.log('🔍 Buscando OF no banco...');
      const { data: existing, error: findError } = await supabaseAdmin
        .from('ofs')
        .select('*')
        .eq('id', id)
        .single();

      if (findError) {
        console.error('❌ Erro ao buscar OF:', findError);
        return res.status(404).json({
          success: false,
          message: 'OF não encontrada',
          error: findError.message
        });
      }

      if (!existing) {
        console.log('❌ OF não encontrada');
        return res.status(404).json({
          success: false,
          message: 'OF não encontrada'
        });
      }

      console.log('✅ OF encontrada:', {
        id: existing.id,
        codigo: existing.codigo,
        status: existing.status
      });

      // Verificar se já está concluída
      if (existing.status === 'concluida') {
        console.log('⚠️ OF já está concluída');
        return res.status(400).json({
          success: false,
          message: 'OF já está concluída'
        });
      }

      // Atualizar status para concluída
      console.log('🔄 Atualizando status para concluída...');
      const updateData = {
        status: 'concluida'
      };
      console.log('📦 Update data:', updateData);

      const { data, error } = await supabaseAdmin
        .from('ofs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar OF:', error);
        console.error('Erro completo:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ OF concluída com sucesso!');
      console.log('📦 Dados atualizados:', data);

      res.json({
        success: true,
        message: 'OF concluída com sucesso',
        data
      });

    } catch (error) {
      console.error('❌ ERRO FATAL AO CONCLUIR OF:', error);
      console.error('Tipo do erro:', error.name);
      console.error('Mensagem:', error.message);
      console.error('Stack trace:', error.stack);

      res.status(500).json({
        success: false,
        message: error.message,
        errorType: error.name,
        errorDetails: error
      });
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
            // Incluir todas as OFs válidas (re-importação inteligente irá decidir se cria ou atualiza)
            ofsEncontradas.push({
              codigo,
              referencia,
              descricao,
              quantidade
            });
          }
        }
      }

      console.log(`✅ ${ofsEncontradas.length} OFs encontradas (novas + existentes)`);

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

      console.log(`📦 Processando ${ofs.length} OFs em lote (importação inteligente)...`);

      const ofsNovas = [];
      const ofsAtualizadas = [];
      const ofsPuladas = [];

      for (const ofData of ofs) {
        try {
          // Buscar OF existente pelo código
          const { data: ofExistente, error: findError } = await supabaseAdmin
            .from('ofs')
            .select('*')
            .eq('codigo', ofData.codigo)
            .maybeSingle();

          if (findError) throw findError;

          if (ofExistente) {
            // ======================================
            // OF JÁ EXISTE - DECIDIR O QUE FAZER
            // ======================================

            if (ofExistente.status === 'aberta' || ofExistente.status === 'em_andamento') {
              // ✅ ATUALIZAR quantidade (PDF tem a "verdade atual")
              console.log(`🔄 Atualizando OF ${ofData.codigo}: ${ofExistente.quantidade} → ${ofData.quantidade}`);

              const updateData = {
                quantidade: ofData.quantidade,
                updated_at: new Date().toISOString()
              };

              // Atualizar referência e descrição se fornecidas
              if (ofData.referencia) updateData.referencia = ofData.referencia;
              if (ofData.descricao) updateData.descricao = ofData.descricao;

              const { data: updated, error: updateError } = await supabaseAdmin
                .from('ofs')
                .update(updateData)
                .eq('id', ofExistente.id)
                .select()
                .single();

              if (updateError) throw updateError;

              // Calcular diferença
              const diferenca = ofData.quantidade - ofExistente.quantidade;

              ofsAtualizadas.push({
                of: ofData.codigo,
                quantidadeAnterior: ofExistente.quantidade,
                quantidadeNova: ofData.quantidade,
                diferenca: diferenca,
                status: ofExistente.status,
                dados: updated
              });

            } else if (ofExistente.status === 'concluida') {
              // OF CONCLUÍDA - Verificar se quer reabrir
              // Por padrão, reabre se aparecer no PDF novamente
              console.log(`↪️ OF ${ofData.codigo} estava concluída, reabrindo...`);

              const updateData = {
                quantidade: ofData.quantidade,
                status: 'aberta',
                data_conclusao: null,
                updated_at: new Date().toISOString()
              };

              if (ofData.referencia) updateData.referencia = ofData.referencia;
              if (ofData.descricao) updateData.descricao = ofData.descricao;

              const { data: updated, error: updateError } = await supabaseAdmin
                .from('ofs')
                .update(updateData)
                .eq('id', ofExistente.id)
                .select()
                .single();

              if (updateError) throw updateError;

              ofsAtualizadas.push({
                of: ofData.codigo,
                quantidadeAnterior: ofExistente.quantidade,
                quantidadeNova: ofData.quantidade,
                diferenca: ofData.quantidade - ofExistente.quantidade,
                status: 'reaberta',
                statusAnterior: 'concluida',
                dados: updated
              });
            }

          } else {
            // ======================================
            // OF NÃO EXISTE - CRIAR
            // ======================================
            console.log(`✨ Criando nova OF ${ofData.codigo}`);

            const insertData = {
              codigo: ofData.codigo,
              quantidade: ofData.quantidade,
              status: 'aberta'
            };

            if (ofData.referencia) insertData.referencia = ofData.referencia;
            if (ofData.descricao) insertData.descricao = ofData.descricao;

            const { data: novaOf, error: insertError } = await supabaseAdmin
              .from('ofs')
              .insert(insertData)
              .select()
              .single();

            if (insertError) throw insertError;

            ofsNovas.push({
              of: novaOf.codigo,
              quantidade: novaOf.quantidade,
              dados: novaOf
            });
          }

        } catch (error) {
          console.error(`❌ Erro ao processar OF ${ofData.codigo}:`, error);
          ofsPuladas.push({
            of: ofData.codigo,
            motivo: error.message
          });
        }
      }

      console.log(`✅ ${ofsNovas.length} OFs novas criadas`);
      console.log(`🔄 ${ofsAtualizadas.length} OFs atualizadas`);
      console.log(`⏩ ${ofsPuladas.length} OFs puladas/erro`);

      // RETORNAR RESUMO DETALHADO
      res.json({
        success: true,
        resumo: {
          total_processadas: ofs.length,
          novas: ofsNovas.length,
          atualizadas: ofsAtualizadas.length,
          puladas: ofsPuladas.length
        },
        detalhes: {
          ofs_novas: ofsNovas,
          ofs_atualizadas: ofsAtualizadas,
          ofs_puladas: ofsPuladas
        },
        // Manter compatibilidade com código antigo
        data: {
          criadas: ofsNovas.length,
          atualizadas: ofsAtualizadas.length,
          erros: ofsPuladas.length,
          detalhes: {
            ofsCriadas: ofsNovas.map(o => o.dados),
            ofsAtualizadas: ofsAtualizadas.map(o => o.dados),
            erros: ofsPuladas
          }
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