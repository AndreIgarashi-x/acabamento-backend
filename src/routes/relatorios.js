const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { supabaseAdmin } = require('../config/supabase');

// Middleware de autenticação
const { authenticateToken } = require('../middlewares/auth');

// Gerar relatório completo de todos os produtos
router.get('/completo/pdf', authenticateToken, async (req, res) => {
  try {
    console.log('📄 Gerando relatório completo de produção...');

    // PASSO 1: Buscar todas as OFs que tiveram produção
    const { data: ofs, error: ofsError } = await supabaseAdmin
      .from('ofs')
      .select('id, codigo, referencia, descricao')
      .order('referencia');

    if (ofsError) {
      console.error('❌ Erro ao buscar OFs:', ofsError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar produtos'
      });
    }

    console.log('📦 Total de OFs encontradas:', ofs.length);

    // PASSO 2: Para cada OF, buscar produção
    const produtoComProducao = [];

    for (const of of ofs) {
      // Buscar atividades dessa OF
      const { data: atividades, error: atError } = await supabaseAdmin
        .from('activities')
        .select(`
          id,
          process_id,
          user_id,
          ts_inicio,
          ts_fim,
          pecas_concluidas,
          tempo_total_seg,
          processes!inner(nome),
          users!inner(nome, matricula),
          pecas_registradas(
            id,
            tempo_decorrido
          )
        `)
        .eq('of_id', of.id)
        .not('ts_fim', 'is', null);

      // Se não tem atividades, pula essa OF
      if (!atividades || atividades.length === 0) {
        continue;
      }

      // Agrupar por processo
      const porProcesso = {};

      atividades.forEach(atividade => {
        const processo = atividade.processes.nome;

        if (!porProcesso[processo]) {
          porProcesso[processo] = {
            nome: processo,
            colaboradores: new Set(),
            tempoTotalSegundos: 0,
            quantidadeTotal: 0
          };
        }

        // Adicionar colaborador
        porProcesso[processo].colaboradores.add(atividade.users.nome);

        // ✅ MÉTODO 1: Se tem pecas_registradas, calcular tempos INDIVIDUAIS (não acumulados!)
        if (atividade.pecas_registradas && atividade.pecas_registradas.length > 0) {
          // Ordenar por tempo_decorrido (que é acumulado) para garantir ordem correta
          const pecasOrdenadas = [...atividade.pecas_registradas].sort((a, b) => a.tempo_decorrido - b.tempo_decorrido);

          pecasOrdenadas.forEach((peca, index) => {
            // Calcular tempo individual: diferença entre peça atual e anterior
            let tempoIndividual;
            if (index === 0) {
              // Primeira peça: tempo individual = tempo total
              tempoIndividual = peca.tempo_decorrido;
            } else {
              // Peças seguintes: tempo individual = diferença
              tempoIndividual = peca.tempo_decorrido - pecasOrdenadas[index - 1].tempo_decorrido;
            }

            // ⚠️ Ignorar tempos negativos ou zero (dados inconsistentes)
            if (tempoIndividual > 0) {
              porProcesso[processo].tempoTotalSegundos += tempoIndividual;
              porProcesso[processo].quantidadeTotal++;
            } else {
              console.log(`⚠️ Tempo individual inválido ignorado: ${tempoIndividual}s (peça ${index + 1})`);
            }
          });
        }
        // ✅ MÉTODO 2 (Fallback): Se não tem pecas_registradas, usar tempo_total_seg (já com pausas subtraídas)
        else if (atividade.pecas_concluidas && atividade.pecas_concluidas > 0) {
          // ✅ CORREÇÃO: Usar tempo_total_seg que já tem pausas subtraídas!
          const tempoTotalAtividade = atividade.tempo_total_seg || 0; // em segundos (já sem pausas)

          // Tempo médio = tempo total da atividade (líquido) / número de peças
          const tempoPorPeca = tempoTotalAtividade / atividade.pecas_concluidas;

          // Somar para cada peça
          for (let i = 0; i < atividade.pecas_concluidas; i++) {
            porProcesso[processo].tempoTotalSegundos += tempoPorPeca;
            porProcesso[processo].quantidadeTotal++;
          }

          console.log(`⚠️ Fallback para ${processo}: ${tempoTotalAtividade}s (líquido) / ${atividade.pecas_concluidas} peças = ${tempoPorPeca.toFixed(2)}s/peça`);
        }
      });

      // ✅ Calcular tempo médio APÓS somar tudo
      const processosFormatados = Object.values(porProcesso).map(proc => {
        // ✅ FÓRMULA CORRETA: Tempo Total ÷ Quantidade Total
        const tempoMedioPorPeca = proc.quantidadeTotal > 0
          ? proc.tempoTotalSegundos / proc.quantidadeTotal
          : 0;

        const minutos = Math.floor(tempoMedioPorPeca / 60);
        const segundos = Math.floor(tempoMedioPorPeca % 60);

        // 🔍 DEBUG LOG
        console.log(`\n🔍 DEBUG - Processo: ${proc.nome}`);
        console.log(`   Tempo Total: ${proc.tempoTotalSegundos} seg (${(proc.tempoTotalSegundos/60).toFixed(2)} min)`);
        console.log(`   Quantidade: ${proc.quantidadeTotal} peças`);
        console.log(`   Tempo Médio: ${tempoMedioPorPeca.toFixed(2)} seg/peça`);
        console.log(`   Formatado: ${minutos}:${segundos.toString().padStart(2, '0')}`);

        // ⚠️ VALIDAÇÃO: Detectar valores anormais
        if (tempoMedioPorPeca > 300) { // Mais de 5 minutos por peça
          console.log(`   ⚠️ AVISO: Tempo médio muito alto! Pode haver erro nos dados.`);
        }

        return {
          processo: proc.nome,
          colaboradores: Array.from(proc.colaboradores).join(', '),
          tempo_medio: `${minutos}:${segundos.toString().padStart(2, '0')}`,
          quantidade: proc.quantidadeTotal
        };
      });

      // Se tem processos, adiciona ao relatório
      if (processosFormatados.length > 0) {
        produtoComProducao.push({
          referencia: of.referencia,
          descricao: of.descricao,
          codigo: of.codigo,
          processos: processosFormatados.sort((a, b) =>
            a.processo.localeCompare(b.processo)
          )
        });
      }
    }

    console.log('✅ Produtos com produção:', produtoComProducao.length);

    // Se não tem dados
    if (produtoComProducao.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum produto com produção registrada'
      });
    }

    // ============================================
    // PASSO 3: GERAR PDF COM LAYOUT CORRIGIDO
    // ============================================

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 80, left: 50, right: 50 },
      bufferPages: true,
      autoFirstPage: true
    });

    // Configurar headers para download
    const filename = `relatorio-producao-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe para response
    doc.pipe(res);

    // ============================================
    // CONSTANTES DE LAYOUT
    // ============================================
    const CORES = {
      verde: '#2ecc71',
      verdeClaro: '#d4edda',
      amareloClaro: '#fff3cd',
      cinza: '#e0e0e0',
      cinzaEscuro: '#646464'
    };

    const MEDIDAS = {
      alturaCabecalhoProduto: 35,
      alturaCabecalhoTabela: 28,
      alturaLinhaTabela: 24,
      espacoEntreProdutos: 10,
      paddingVertical: 7,
      margemInferior: 80,
      posYInicial: 145
    };

    const COLUNAS = {
      x: 50,
      larguras: {
        processo: 170,
        colaborador: 220,
        tempo: 70,
        qtd: 55
      },
      posicoes: {
        processo: 55,
        colaborador: 225,
        tempo: 450,
        qtd: 525
      },
      separadores: [220, 395, 470]
    };

    // ============================================
    // FUNÇÕES AUXILIARES
    // ============================================
    const truncarTexto = (texto, larguraMax) => {
      if (!texto) return '';
      const caracteresMax = Math.floor(larguraMax / 5);
      if (texto.length <= caracteresMax) return texto;
      return texto.substring(0, caracteresMax - 3) + '...';
    };

    const calcularAlturaProduto = (processos) => {
      const numLinhas = processos.length;
      return MEDIDAS.alturaCabecalhoProduto +
             MEDIDAS.alturaCabecalhoTabela +
             (numLinhas * MEDIDAS.alturaLinhaTabela) +
             MEDIDAS.espacoEntreProdutos +
             20;
    };

    const verificarEspacoPagina = (yAtual, alturaMinima) => {
      if (yAtual + alturaMinima > doc.page.height - MEDIDAS.margemInferior) {
        doc.addPage();
        return 80;
      }
      return yAtual;
    };

    const desenharCabecalhoProduto = (produto, of, y) => {
      doc.rect(COLUNAS.x, y, 515, MEDIDAS.alturaCabecalhoProduto)
         .fillAndStroke(CORES.verdeClaro, CORES.verde)
         .lineWidth(1);

      const produtoTruncado = truncarTexto(produto, 480);

      doc.fillColor('#000')
         .font('Helvetica-Bold')
         .fontSize(11)
         .text(`Produto: ${produtoTruncado}`, 60, y + 10)
         .fontSize(9)
         .text(`OF: ${of}`, 60, y + 23);

      doc.font('Helvetica');
      return y + MEDIDAS.alturaCabecalhoProduto + 5;
    };

    const desenharCabecalhoTabela = (y) => {
      doc.rect(COLUNAS.x, y, 515, MEDIDAS.alturaCabecalhoTabela)
         .fillAndStroke(CORES.verde, CORES.verde);

      doc.fillColor('#fff')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('PROCESSO', COLUNAS.posicoes.processo, y + 9, {
           width: COLUNAS.larguras.processo
         })
         .text('COLABORADOR(ES)', COLUNAS.posicoes.colaborador, y + 9, {
           width: COLUNAS.larguras.colaborador
         })
         .text('TEMPO\nMÉDIO', COLUNAS.posicoes.tempo, y + 4, {
           width: COLUNAS.larguras.tempo,
           align: 'center',
           lineGap: -2
         })
         .text('QTD', COLUNAS.posicoes.qtd, y + 9, {
           width: COLUNAS.larguras.qtd,
           align: 'center'
         });

      doc.font('Helvetica');
      return y + MEDIDAS.alturaCabecalhoTabela;
    };

    const desenharLinhaDados = (dados, y, ultimaLinha = false) => {
      // Linha superior
      doc.strokeColor(CORES.cinza).lineWidth(0.5)
         .moveTo(COLUNAS.x, y).lineTo(COLUNAS.x + 515, y).stroke();

      // Conteúdo das células
      doc.fillColor('#000').fontSize(9)
         .text(
           truncarTexto(dados.processo, COLUNAS.larguras.processo),
           COLUNAS.posicoes.processo,
           y + MEDIDAS.paddingVertical
         )
         .text(
           truncarTexto(dados.colaboradores, COLUNAS.larguras.colaborador),
           COLUNAS.posicoes.colaborador,
           y + MEDIDAS.paddingVertical
         )
         .text(
           dados.tempo_medio,
           COLUNAS.posicoes.tempo,
           y + MEDIDAS.paddingVertical,
           { width: COLUNAS.larguras.tempo, align: 'center' }
         )
         .text(
           dados.quantidade.toString(),
           COLUNAS.posicoes.qtd,
           y + MEDIDAS.paddingVertical,
           { width: COLUNAS.larguras.qtd, align: 'center' }
         );

      // Linhas verticais
      COLUNAS.separadores.forEach(x => {
        doc.strokeColor(CORES.cinza).lineWidth(0.5)
           .moveTo(x, y)
           .lineTo(x, y + MEDIDAS.alturaLinhaTabela)
           .stroke();
      });

      // Linha inferior
      if (ultimaLinha) {
        doc.strokeColor(CORES.verde).lineWidth(1.5);
      } else {
        doc.strokeColor(CORES.cinza).lineWidth(0.5);
      }
      doc.moveTo(COLUNAS.x, y + MEDIDAS.alturaLinhaTabela)
         .lineTo(COLUNAS.x + 515, y + MEDIDAS.alturaLinhaTabela)
         .stroke();

      return y + MEDIDAS.alturaLinhaTabela;
    };

    // ============================================
    // CABEÇALHO PRINCIPAL DO PDF
    // ============================================
    doc.font('Helvetica-Bold')
       .fontSize(18)
       .fillColor('#000')
       .text('DCJ UNIFORMES', 0, 60, { align: 'center' })
       .fontSize(14)
       .text('Relatório Completo de Produção', 0, 85, { align: 'center' })
       .font('Helvetica')
       .fontSize(10)
       .fillColor(CORES.cinzaEscuro)
       .text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 0, 105, { align: 'center' });

    doc.moveTo(50, 125).lineTo(565, 125)
       .strokeColor(CORES.verde).lineWidth(2).stroke();

    let yPos = MEDIDAS.posYInicial;

    // ============================================
    // PROCESSAR PRODUTOS
    // ============================================
    let totalPecasGeral = 0;

    produtoComProducao.forEach((produto, index) => {
      // ✅ CALCULAR altura total do produto antes de desenhar
      const alturaProduto = calcularAlturaProduto(produto.processos);

      // ✅ VERIFICAR se cabe na página atual
      yPos = verificarEspacoPagina(yPos, alturaProduto);

      // Desenhar cabeçalho do produto
      const produtoTexto = `${produto.referencia} - ${produto.descricao}`;
      yPos = desenharCabecalhoProduto(produtoTexto, produto.codigo, yPos);

      // Desenhar cabeçalho da tabela
      yPos = desenharCabecalhoTabela(yPos);

      // Desenhar linhas de dados
      produto.processos.forEach((proc, idx) => {
        const ultimaLinha = idx === produto.processos.length - 1;
        yPos = desenharLinhaDados(proc, yPos, ultimaLinha);
        totalPecasGeral += proc.quantidade;
      });

      // Espaçamento entre produtos
      yPos += MEDIDAS.espacoEntreProdutos;
    });

    // ============================================
    // RESUMO FINAL
    // ============================================
    yPos = verificarEspacoPagina(yPos, 100);
    yPos += 20;

    const totalProdutos = produtoComProducao.length;

    doc.rect(50, yPos, 515, 75)
       .fillAndStroke(CORES.amareloClaro, CORES.verde)
       .lineWidth(2);

    doc.fillColor('#000')
       .font('Helvetica-Bold')
       .fontSize(13)
       .text('RESUMO GERAL', 50, yPos + 15, { width: 515, align: 'center' })
       .fontSize(11)
       .text(
         `Total de Produtos: ${totalProdutos}`,
         50, yPos + 35,
         { width: 515, align: 'center' }
       )
       .text(
         `Total de Peças Produzidas: ${totalPecasGeral.toLocaleString('pt-BR')}`,
         50, yPos + 52,
         { width: 515, align: 'center' }
       );

    // ============================================
    // FINALIZAR E ADICIONAR PAGINAÇÃO
    // ============================================

    // ✅ IMPORTANTE: Finalizar ANTES de adicionar numeração
    doc.end();

    // ✅ Adicionar numeração SOMENTE nas páginas existentes
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .fillColor(CORES.cinzaEscuro)
         .text(
           `Página ${i + 1} de ${pageCount} | DCJ Uniformes - Sistema de Cronometragem`,
           50,
           doc.page.height - 35,
           { width: 515, align: 'center' }
         );
    }

    console.log('✅ PDF gerado com sucesso!');
    console.log(`📊 Produtos: ${totalProdutos} | Peças: ${totalPecasGeral}`);

  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error);

    // Se já começou a enviar o PDF, não pode mais enviar JSON
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar relatório',
        error: error.message
      });
    }
  }
});

module.exports = router;
