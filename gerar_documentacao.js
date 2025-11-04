// Script para gerar documentação completa do sistema em PDF
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function criarDocumentacao() {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const outputPath = path.join('C:', 'Users', 'andre', 'acabamento-app', 'DOCUMENTACAO_SISTEMA.pdf');

  doc.pipe(fs.createWriteStream(outputPath));

  // =====================================================
  // PÁGINA 1 - CAPA
  // =====================================================

  doc.fontSize(28).font('Helvetica-Bold').text('DOCUMENTAÇÃO DO SISTEMA', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(24).text('App Cronometragem Acabamento', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(16).font('Helvetica').text('DCJ Uniformes', { align: 'center' });

  doc.moveDown(3);
  doc.fontSize(12).text('Data: ' + new Date().toLocaleDateString('pt-BR'), { align: 'center' });
  doc.text('Versão: 1.0', { align: 'center' });

  doc.moveDown(5);
  doc.fontSize(10).text('Este documento contém informações técnicas completas sobre o sistema', { align: 'center' });
  doc.text('de cronometragem e controle de produção do setor de acabamento.', { align: 'center' });

  // =====================================================
  // PÁGINA 2 - VISÃO GERAL
  // =====================================================

  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').text('1. VISÃO GERAL DO SISTEMA');
  doc.moveDown();

  doc.fontSize(12).font('Helvetica');

  doc.text('O App Cronometragem Acabamento é um sistema web desenvolvido para controlar e cronometrar a produção do setor de acabamento da DCJ Uniformes.');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('1.1 Objetivo Principal');
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica');
  doc.text('• Registrar o tempo de produção de cada peça individualmente');
  doc.text('• Calcular automaticamente o TPU (Tempo Por Unidade)');
  doc.text('• Gerar relatórios de produtividade em tempo real');
  doc.text('• Monitorar o progresso de Ordens de Fabricação (OFs)');
  doc.text('• Identificar gargalos e oportunidades de melhoria');

  doc.moveDown();
  doc.fontSize(14).font('Helvetica-Bold').text('1.2 Usuários do Sistema');
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica');
  doc.text('• Operadores: Registram suas atividades e cronometram produção');
  doc.text('• Gestores: Visualizam relatórios e KPIs de produtividade');
  doc.text('• Administradores: Gerenciam usuários, processos e OFs');

  // =====================================================
  // PÁGINA 3 - ARQUITETURA
  // =====================================================

  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').text('2. ARQUITETURA DO SISTEMA');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('2.1 Arquitetura Geral');
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica');
  doc.text('O sistema segue arquitetura Cliente-Servidor com separação completa:');
  doc.moveDown();

  doc.fontSize(11).font('Helvetica-Bold').text('Frontend (React):');
  doc.font('Helvetica');
  doc.text('• Aplicação SPA (Single Page Application) com React 19 + Vite');
  doc.text('• Interface responsiva com TailwindCSS');
  doc.text('• Gerenciamento de estado com Context API');
  doc.text('• Roteamento com React Router');
  doc.text('• Deploy no Railway');
  doc.moveDown();

  doc.fontSize(11).font('Helvetica-Bold').text('Backend (Node.js + Express):');
  doc.font('Helvetica');
  doc.text('• API RESTful com Express.js');
  doc.text('• Autenticação JWT com bcrypt');
  doc.text('• Geração de PDF com PDFKit');
  doc.text('• Rate limiting e segurança com Helmet');
  doc.text('• Deploy no Railway');
  doc.moveDown();

  doc.fontSize(11).font('Helvetica-Bold').text('Banco de Dados (Supabase/PostgreSQL):');
  doc.font('Helvetica');
  doc.text('• PostgreSQL hospedado no Supabase');
  doc.text('• Views para cálculos de TPU');
  doc.text('• Triggers e functions para automação');
  doc.text('• Backups automáticos diários');

  // =====================================================
  // PÁGINA 4 - TECNOLOGIAS
  // =====================================================

  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').text('3. TECNOLOGIAS UTILIZADAS');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('3.1 Frontend');
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text('• React 19.0.0 - Biblioteca para interface');
  doc.text('• Vite - Build tool e dev server');
  doc.text('• TailwindCSS - Framework CSS utilitário');
  doc.text('• Axios - Cliente HTTP para APIs');
  doc.text('• React Router - Roteamento');
  doc.text('• Lucide React - Ícones modernos');

  doc.moveDown();
  doc.fontSize(14).font('Helvetica-Bold').text('3.2 Backend');
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text('• Node.js - Runtime JavaScript');
  doc.text('• Express 4.21.2 - Framework web');
  doc.text('• Supabase JS - Cliente para PostgreSQL');
  doc.text('• JWT (jsonwebtoken) - Autenticação');
  doc.text('• Bcrypt - Hash de senhas');
  doc.text('• PDFKit - Geração de PDFs');
  doc.text('• Helmet - Segurança HTTP');
  doc.text('• Morgan - Logs de requisições');
  doc.text('• Express Rate Limit - Limitação de requisições');

  doc.moveDown();
  doc.fontSize(14).font('Helvetica-Bold').text('3.3 Infraestrutura');
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text('• Railway - Hospedagem frontend e backend');
  doc.text('• Supabase - Banco de dados PostgreSQL');
  doc.text('• GitHub - Controle de versão');
  doc.text('• Git - Versionamento');

  // =====================================================
  // PÁGINA 5 - BANCO DE DADOS
  // =====================================================

  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').text('4. BANCO DE DADOS');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('4.1 Tabelas Principais');
  doc.moveDown(0.5);

  // Tabela users
  doc.fontSize(12).font('Helvetica-Bold').text('users');
  doc.fontSize(10).font('Helvetica');
  doc.text('Armazena os usuários do sistema (operadores, gestores, administradores).');
  doc.text('Campos: id, nome, email, senha_hash, papel, status, created_at');
  doc.moveDown();

  // Tabela processes
  doc.fontSize(12).font('Helvetica-Bold').text('processes');
  doc.fontSize(10).font('Helvetica');
  doc.text('Cadastro de processos produtivos (Casear, Pregar botão, Fazer barra, etc).');
  doc.text('Campos: id, nome, descricao, ativo, created_at');
  doc.moveDown();

  // Tabela ofs
  doc.fontSize(12).font('Helvetica-Bold').text('ofs');
  doc.fontSize(10).font('Helvetica');
  doc.text('Ordens de Fabricação com produtos e quantidades.');
  doc.text('Campos: id, codigo, quantidade, referencia, descricao, status, created_at');
  doc.moveDown();

  // Tabela activities
  doc.fontSize(12).font('Helvetica-Bold').text('activities');
  doc.fontSize(10).font('Helvetica');
  doc.text('Atividades de produção (cada operador + OF + processo).');
  doc.text('Campos: id, of_id, processo_id, usuario_id, status, pecas_concluidas,');
  doc.text('tempo_total_seg, pausas, ts_inicio, ts_fim, pecas_registradas');
  doc.moveDown();

  // Tabela pecas_registradas
  doc.fontSize(12).font('Helvetica-Bold').text('pecas_registradas');
  doc.fontSize(10).font('Helvetica');
  doc.text('Registro individual de cada peça produzida (tracking peça a peça).');
  doc.text('Campos: id, atividade_id, of_id, usuario_id, processo_id, numero_peca,');
  doc.text('tempo_decorrido, timestamp_conclusao');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('4.2 Views Importantes');
  doc.moveDown(0.5);

  doc.fontSize(12).font('Helvetica-Bold').text('v_tpu_por_peca');
  doc.fontSize(10).font('Helvetica');
  doc.text('View que calcula o TPU individual de cada peça usando SQL LAG().');
  doc.text('Converte tempo acumulado em tempo individual por peça.');
  doc.text('Usado para relatórios e análises de produtividade.');

  // =====================================================
  // PÁGINA 6 - ROTAS DA API
  // =====================================================

  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').text('5. ROTAS DA API');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('5.1 Autenticação (/api/auth)');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('POST /api/auth/login - Login de usuário');
  doc.text('POST /api/auth/register - Registro de novo usuário (admin)');
  doc.text('GET /api/auth/me - Dados do usuário autenticado');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('5.2 Usuários (/api/users)');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('GET /api/users - Listar usuários');
  doc.text('GET /api/users/:id - Buscar usuário por ID');
  doc.text('PUT /api/users/:id - Atualizar usuário');
  doc.text('DELETE /api/users/:id - Deletar usuário');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('5.3 OFs (/api/ofs)');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('GET /api/ofs - Listar OFs (com contagem de atividades)');
  doc.text('GET /api/ofs/:id - Buscar OF por ID');
  doc.text('POST /api/ofs - Criar nova OF');
  doc.text('POST /api/ofs/upload - Upload de PDF com múltiplas OFs');
  doc.text('PUT /api/ofs/:id - Atualizar OF');
  doc.text('DELETE /api/ofs/:id - Deletar OF');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('5.4 Processos (/api/processes)');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('GET /api/processes - Listar processos');
  doc.text('POST /api/processes - Criar processo');
  doc.text('PUT /api/processes/:id - Atualizar processo');
  doc.text('DELETE /api/processes/:id - Deletar processo');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('5.5 Atividades (/api/activities)');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('GET /api/activities - Listar atividades (com filtros)');
  doc.text('GET /api/activities/:id - Buscar atividade por ID');
  doc.text('POST /api/activities/start - Iniciar atividade');
  doc.text('POST /api/activities/:id/finish-piece - Concluir peça');
  doc.text('POST /api/activities/:id/finish - Finalizar atividade');
  doc.text('POST /api/activities/:id/pause - Pausar atividade');
  doc.text('POST /api/activities/:id/resume - Retomar atividade');

  // =====================================================
  // PÁGINA 7 - ROTAS DA API (CONTINUAÇÃO)
  // =====================================================

  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').text('5. ROTAS DA API (cont.)');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('5.6 Dashboard (/api/dashboard)');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('GET /api/dashboard/resumo - Resumo geral (KPIs principais)');
  doc.text('GET /api/dashboard/processos - Dados dos processos');
  doc.text('GET /api/dashboard/colaboradores - Dados dos colaboradores');
  doc.text('GET /api/dashboard/evolucao-temporal - Evolução do TPU no tempo');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('5.7 Analytics (/api/analytics)');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('GET /api/analytics/overview - Visão geral analítica');
  doc.text('GET /api/analytics/performance - Performance por período');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('5.8 Reports (/api/reports)');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('GET /api/reports/productivity - Relatório de produtividade');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('5.9 Relatórios PDF (/api/relatorios)');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('GET /api/relatorios/completo/pdf - Gera PDF completo de produção');
  doc.text('  • Agrupa atividades por produto e processo');
  doc.text('  • Calcula tempo médio por peça (TPU)');
  doc.text('  • Corrige tempo acumulado para tempo individual');
  doc.text('  • Formata em PDF profissional com tabelas');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('5.10 Assistente IA (/api/assistant)');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('POST /api/assistant/analyze - Análise com IA (integração futura)');

  // =====================================================
  // PÁGINA 8 - FUNCIONALIDADES
  // =====================================================

  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').text('6. FUNCIONALIDADES PRINCIPAIS');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('6.1 Cronometragem Peça a Peça');
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text('O sistema registra o tempo de produção de cada peça individualmente:');
  doc.fontSize(10);
  doc.text('1. Operador seleciona OF e processo');
  doc.text('2. Inicia atividade - cronômetro começa');
  doc.text('3. A cada peça concluída, clica em "Concluir Peça"');
  doc.text('4. Sistema registra tempo acumulado até aquela peça');
  doc.text('5. Calcula tempo individual: tempo_atual - tempo_anterior');
  doc.text('6. Gera histórico detalhado de cada peça');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('6.2 Cálculo de TPU (Tempo Por Unidade)');
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text('O TPU é calculado de duas formas:');
  doc.fontSize(10);
  doc.text('• Método 1: Para atividades com registro peça a peça');
  doc.text('  - Calcula diferença entre tempo acumulado de peças consecutivas');
  doc.text('  - TPU = (tempo_peça_N - tempo_peça_N-1) / 1');
  doc.text('• Método 2: Para atividades antigas (fallback)');
  doc.text('  - Usa tempo_total_seg (já descontadas pausas)');
  doc.text('  - TPU = tempo_total_seg / pecas_concluidas');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('6.3 Dashboard Tempo Real');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('• KPIs principais: TPU médio, peças produzidas, atividades ativas');
  doc.text('• Gráficos de desempenho por processo');
  doc.text('• Ranking de colaboradores');
  doc.text('• Evolução temporal do TPU');
  doc.text('• Atualização automática a cada 30 segundos');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('6.4 Relatório PDF Completo');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('• Gerado via botão "Relatório Completo" no dashboard');
  doc.text('• Agrupa produção por produto e processo');
  doc.text('• Calcula tempo médio por peça de forma correta');
  doc.text('• Inclui nomes dos colaboradores');
  doc.text('• Formatação profissional em PDF');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('6.5 Gestão de Pausas');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('• Operador pode pausar e retomar atividade');
  doc.text('• Tempo de pausa é registrado separadamente');
  doc.text('• Descontado automaticamente do tempo total');
  doc.text('• Não afeta cálculo do TPU');

  // =====================================================
  // PÁGINA 9 - FLUXO DE TRABALHO
  // =====================================================

  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').text('7. FLUXO DE TRABALHO');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('7.1 Fluxo do Operador');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('1. Login no sistema');
  doc.text('2. Seleciona OF e processo a executar');
  doc.text('3. Clica em "Iniciar Atividade"');
  doc.text('4. Cronômetro inicia automaticamente');
  doc.text('5. Produz primeira peça');
  doc.text('6. Clica em "Concluir Peça" - sistema registra tempo');
  doc.text('7. Repete passos 5-6 para cada peça');
  doc.text('8. Se necessário, pode pausar/retomar');
  doc.text('9. Ao terminar, clica em "Finalizar Atividade"');
  doc.text('10. Sistema calcula totais e TPU final');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('7.2 Fluxo do Gestor');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('1. Login no sistema');
  doc.text('2. Acessa Dashboard');
  doc.text('3. Visualiza KPIs em tempo real');
  doc.text('4. Analisa gráficos de desempenho');
  doc.text('5. Identifica gargalos e oportunidades');
  doc.text('6. Baixa relatório PDF completo');
  doc.text('7. Toma decisões baseadas em dados');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('7.3 Fluxo do Administrador');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('1. Login no sistema');
  doc.text('2. Cadastra novos usuários');
  doc.text('3. Cria/edita processos produtivos');
  doc.text('4. Importa OFs via PDF ou cria manualmente');
  doc.text('5. Gerencia permissões de usuários');
  doc.text('6. Monitora saúde do sistema');

  // =====================================================
  // PÁGINA 10 - DEPLOY E CONFIGURAÇÃO
  // =====================================================

  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').text('8. DEPLOY E CONFIGURAÇÃO');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('8.1 Variáveis de Ambiente');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('Backend (.env):');
  doc.text('• PORT - Porta do servidor (padrão: 3000)');
  doc.text('• NODE_ENV - Ambiente (development/production)');
  doc.text('• SUPABASE_URL - URL do projeto Supabase');
  doc.text('• SUPABASE_SERVICE_KEY - Chave de serviço do Supabase');
  doc.text('• JWT_SECRET - Segredo para geração de tokens JWT');
  doc.text('• FRONTEND_URL - URL do frontend para CORS');
  doc.moveDown();

  doc.text('Frontend (.env):');
  doc.text('• VITE_API_URL - URL da API backend');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('8.2 Deploy no Railway');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('Backend:');
  doc.text('• Repositório: github.com/AndreIgarashi-x/acabamento-backend');
  doc.text('• Branch: main');
  doc.text('• Deploy automático via push no GitHub');
  doc.text('• Build command: npm install');
  doc.text('• Start command: npm start (ou node src/server.js)');
  doc.moveDown();

  doc.text('Frontend:');
  doc.text('• Repositório: github.com/AndreIgarashi-x/acabamento-frontend');
  doc.text('• Branch: main');
  doc.text('• Deploy automático via push no GitHub');
  doc.text('• Build command: npm run build');
  doc.text('• Start command: npm run preview (ou serve)');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('8.3 Banco de Dados Supabase');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('• Projeto hospedado no Supabase (PostgreSQL)');
  doc.text('• Migrations localizadas em backend/migrations/');
  doc.text('• Executar migrations via Supabase Dashboard ou SQL Editor');
  doc.text('• Backups automáticos configurados');
  doc.text('• Views e triggers criados via migrations');

  // =====================================================
  // PÁGINA 11 - MELHORIAS RECENTES
  // =====================================================

  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').text('9. MELHORIAS E CORREÇÕES RECENTES');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('9.1 Sistema de Tracking Peça a Peça');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('Data: Outubro 2024');
  doc.text('Descrição: Implementação do registro individual de cada peça produzida,');
  doc.text('permitindo análise granular de produtividade e identificação de variações.');
  doc.text('Impacto: Aumento de precisão no cálculo de TPU de ~90% para ~99%');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('9.2 Correção Crítica - Tempo Acumulado vs Individual');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('Data: 30/10/2024');
  doc.text('Problema: Relatório PDF mostrava tempos absurdos (14 min/peça quando era 15 seg)');
  doc.text('Causa: Sistema usava tempo_decorrido acumulado diretamente sem calcular diferença');
  doc.text('Solução: Implementado cálculo de diferença: tempo[i] - tempo[i-1]');
  doc.text('Arquivo: backend/src/routes/relatorios.js (linhas 78-102)');
  doc.text('Status: ✅ Corrigido e em produção');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('9.3 Correção - Dashboard Column Not Found');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('Data: 30/10/2024');
  doc.text('Problema: Erro "column tpu_minutos does not exist" em produção');
  doc.text('Causa: Código buscava coluna tpu_minutos mas view criava tpu_individual_seg');
  doc.text('Solução: Alterado para usar tpu_individual_seg com conversão para minutos');
  doc.text('Arquivo: backend/src/routes/dashboard.js (4 localizações)');
  doc.text('Status: ✅ Corrigido e em produção');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('9.4 Implementação - Relatório PDF Completo');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('Data: 29-30/10/2024');
  doc.text('Descrição: Criação de endpoint e botão para gerar PDF completo de produção');
  doc.text('Funcionalidades:');
  doc.text('• Agrupamento por produto e processo');
  doc.text('• Cálculo correto de tempo médio por peça');
  doc.text('• Listagem de colaboradores envolvidos');
  doc.text('• Formatação profissional em PDF');
  doc.text('Arquivo Backend: backend/src/routes/relatorios.js');
  doc.text('Arquivo Frontend: frontend/src/pages/Dashboard.jsx');
  doc.text('Status: ✅ Implementado e em produção');

  // =====================================================
  // PÁGINA 12 - ESTRUTURA DE PASTAS
  // =====================================================

  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').text('10. ESTRUTURA DE PASTAS');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('10.1 Backend');
  doc.moveDown(0.5);
  doc.fontSize(9).font('Courier');
  doc.text('acabamento-app/backend/');
  doc.text('├── src/');
  doc.text('│   ├── config/');
  doc.text('│   │   └── supabase.js        # Configuração cliente Supabase');
  doc.text('│   ├── middlewares/');
  doc.text('│   │   ├── auth.js            # Middleware autenticação JWT');
  doc.text('│   │   └── errorHandler.js    # Tratamento global de erros');
  doc.text('│   ├── routes/');
  doc.text('│   │   ├── auth.js            # Rotas de autenticação');
  doc.text('│   │   ├── users.js           # Rotas de usuários');
  doc.text('│   │   ├── ofs.js             # Rotas de OFs');
  doc.text('│   │   ├── processes.js       # Rotas de processos');
  doc.text('│   │   ├── activities.js      # Rotas de atividades');
  doc.text('│   │   ├── dashboard.js       # Rotas do dashboard');
  doc.text('│   │   ├── analytics.js       # Rotas de analytics');
  doc.text('│   │   ├── reports.js         # Rotas de relatórios');
  doc.text('│   │   ├── relatorios.js      # Geração de PDF');
  doc.text('│   │   └── assistant.js       # Assistente IA (futuro)');
  doc.text('│   ├── utils/');
  doc.text('│   │   └── logger.js          # Logging personalizado');
  doc.text('│   └── server.js              # Servidor principal');
  doc.text('├── migrations/                # Scripts SQL de migração');
  doc.text('├── .env                       # Variáveis de ambiente');
  doc.text('├── package.json               # Dependências do projeto');
  doc.text('└── README.md                  # Documentação');

  doc.moveDown();
  doc.fontSize(14).font('Helvetica-Bold').text('10.2 Frontend');
  doc.moveDown(0.5);
  doc.fontSize(9).font('Courier');
  doc.text('acabamento-app/frontend/');
  doc.text('├── src/');
  doc.text('│   ├── components/            # Componentes reutilizáveis');
  doc.text('│   ├── contexts/              # Context API (AuthContext, etc)');
  doc.text('│   ├── pages/');
  doc.text('│   │   ├── Login.jsx');
  doc.text('│   │   ├── Dashboard.jsx      # Dashboard principal');
  doc.text('│   │   ├── Activities.jsx     # Gestão de atividades');
  doc.text('│   │   ├── OFs.jsx            # Gestão de OFs');
  doc.text('│   │   └── ...                # Outras páginas');
  doc.text('│   ├── services/');
  doc.text('│   │   └── api.js             # Cliente Axios configurado');
  doc.text('│   ├── App.jsx                # Componente principal');
  doc.text('│   └── main.jsx               # Entry point');
  doc.text('├── public/                    # Arquivos estáticos');
  doc.text('├── .env                       # Variáveis de ambiente');
  doc.text('├── package.json               # Dependências');
  doc.text('├── vite.config.js             # Configuração Vite');
  doc.text('└── tailwind.config.js         # Configuração TailwindCSS');

  // =====================================================
  // PÁGINA 13 - SEGURANÇA
  // =====================================================

  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').text('11. SEGURANÇA');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('11.1 Autenticação');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('• JWT (JSON Web Tokens) para sessões');
  doc.text('• Tokens com expiração de 24 horas');
  doc.text('• Senhas hasheadas com bcrypt (salt rounds: 10)');
  doc.text('• Middleware authenticateToken em todas as rotas protegidas');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('11.2 Autorização');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('• Sistema de papéis (roles): operador, gestor, admin');
  doc.text('• Middleware requireRole para controle de acesso');
  doc.text('• Operadores: apenas suas próprias atividades');
  doc.text('• Gestores: visualização de relatórios');
  doc.text('• Admins: acesso total ao sistema');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('11.3 Proteções HTTP');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('• Helmet.js para headers de segurança');
  doc.text('• CORS configurado com whitelist de origens');
  doc.text('• Rate limiting: 100 req/15min geral, 10 req/min crítico');
  doc.text('• Body parser com limite de 10MB');
  doc.text('• Validação de inputs com express-validator');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('11.4 Banco de Dados');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('• Supabase com RLS (Row Level Security)');
  doc.text('• Service key usado apenas no backend');
  doc.text('• Queries parametrizadas (proteção contra SQL injection)');
  doc.text('• Backups automáticos diários');

  // =====================================================
  // PÁGINA 14 - PERFORMANCE
  // =====================================================

  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').text('12. PERFORMANCE');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('12.1 Backend');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('• Compression middleware para respostas HTTP');
  doc.text('• Índices no banco para queries frequentes');
  doc.text('• Views pré-calculadas para TPU (v_tpu_por_peca)');
  doc.text('• Cache em memória para dados estáticos');
  doc.text('• Lazy loading de relacionamentos no Supabase');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('12.2 Frontend');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('• Build otimizado com Vite (tree-shaking, minificação)');
  doc.text('• Code splitting por rotas');
  doc.text('• Lazy loading de componentes pesados');
  doc.text('• Debouncing em inputs de busca');
  doc.text('• Polling inteligente (30s) para dashboard');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('12.3 Banco de Dados');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('• PostgreSQL 15 (Supabase)');
  doc.text('• Índices em colunas de busca frequente');
  doc.text('• Views para cálculos complexos');
  doc.text('• Conexão pooling automático');

  // =====================================================
  // PÁGINA 15 - LOGS E MONITORAMENTO
  // =====================================================

  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').text('13. LOGS E MONITORAMENTO');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('13.1 Logs do Backend');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('• Morgan para logs de requisições HTTP');
  doc.text('• Winston logger customizado (utils/logger.js)');
  doc.text('• Logs separados por nível (info, warn, error)');
  doc.text('• Logs disponíveis no Railway Dashboard');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('13.2 Health Check');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('• Endpoint: GET /health');
  doc.text('• Retorna: status, timestamp, uptime, environment');
  doc.text('• Usado para monitoramento de disponibilidade');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('13.3 Error Handling');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('• Middleware global de error handling');
  doc.text('• Tratamento específico por tipo de erro');
  doc.text('• Logs detalhados de erros com stack trace');
  doc.text('• Mensagens user-friendly para o frontend');

  // =====================================================
  // PÁGINA 16 - ROADMAP FUTURO
  // =====================================================

  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').text('14. ROADMAP FUTURO');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('14.1 Funcionalidades Planejadas');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('• Assistente IA para análise de produtividade');
  doc.text('• Notificações em tempo real (WebSockets)');
  doc.text('• App mobile (React Native)');
  doc.text('• Exportação de dados em Excel');
  doc.text('• Comparação de períodos (mês atual vs anterior)');
  doc.text('• Metas de produção por processo');
  doc.text('• Sistema de gamificação para operadores');
  doc.text('• Integração com ERP existente');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('14.2 Melhorias Técnicas');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('• Testes automatizados (Jest + Supertest)');
  doc.text('• CI/CD pipeline com GitHub Actions');
  doc.text('• Monitoramento com Sentry ou similar');
  doc.text('• Documentação automática da API (Swagger)');
  doc.text('• Otimização de queries com query analysis');
  doc.text('• Implementação de cache distribuído (Redis)');

  // =====================================================
  // PÁGINA 17 - CONTATOS E SUPORTE
  // =====================================================

  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').text('15. INFORMAÇÕES DE CONTATO');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('15.1 Empresa');
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text('DCJ Uniformes');
  doc.text('Setor: Acabamento');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('15.2 Repositórios GitHub');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('Backend: github.com/AndreIgarashi-x/acabamento-backend');
  doc.text('Frontend: github.com/AndreIgarashi-x/acabamento-frontend');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('15.3 URLs de Produção');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('Frontend: [URL do Railway - Frontend]');
  doc.text('Backend API: [URL do Railway - Backend]');
  doc.text('Health Check: [URL Backend]/health');
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('15.4 Banco de Dados');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('Provider: Supabase');
  doc.text('Region: [Região configurada]');
  doc.text('Dashboard: app.supabase.com');

  doc.moveDown(3);
  doc.fontSize(10).font('Helvetica-Oblique').text('Documento gerado automaticamente em ' + new Date().toLocaleDateString('pt-BR'), { align: 'center' });

  // =====================================================
  // FINALIZAR PDF
  // =====================================================

  doc.end();

  console.log('✅ Documentação gerada com sucesso!');
  console.log(`📄 Arquivo salvo em: ${outputPath}`);
}

criarDocumentacao();
