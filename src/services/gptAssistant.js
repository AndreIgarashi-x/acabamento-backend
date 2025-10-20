// =====================================================
// ASSISTENTE IA COM OPENAI GPT
// =====================================================

const OpenAI = require('openai');
const { supabaseAdmin } = require('../config/supabase');

// =====================================================
// Configuração OpenAI
// =====================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// =====================================================
// System Prompt - Instruções para o GPT
// =====================================================

const systemPrompt = `Você é um assistente inteligente de um sistema de gestão de acabamento de uniformes da DCJ Uniformes.

CONTEXTO DO SISTEMA:
- Tabela 'ofs' (Ordens de Fabricação): id, codigo, referencia, descricao, quantidade, status (aberta/concluida)
- Tabela 'activities' (Atividades): id, of_id, user_id, process_id, started_at, finished_at, duration_seconds, pieces_completed
- Tabela 'users' (Usuários): id, nome, matricula, perfil (colaborador/gestor/admin)
- Tabela 'processes' (Processos): id, name (Casear, Costurar, Pregar Botão, Pregar Etiqueta, Empacotar, Revisar)

INSTRUÇÕES:
1. Interprete a pergunta do usuário em português brasileiro
2. Identifique que tipo de consulta é necessária
3. Extraia os parâmetros necessários (códigos de OF, nomes de usuários, processos, datas)
4. Responda SEMPRE em formato JSON válido

FORMATO DE RESPOSTA JSON:
{
  "queryType": "tipo_da_consulta",
  "params": {
    // parâmetros extraídos da pergunta
  },
  "needsData": true/false,
  "interpretation": "explicação breve do que você entendeu"
}

TIPOS DE CONSULTA DISPONÍVEIS:

1. "atividades_por_of" - Quem trabalhou em uma OF específica
   Params: { "ofCodigo": "011593", "processo": "Casear" (opcional) }
   Exemplos: "Quem trabalhou na OF 011593?", "Quem caseou a ordem 011593?"

2. "producao_usuario" - Produtividade de um usuário
   Params: { "usuarioNome": "João Silva", "processo": "Casear" (opcional), "periodo": "hoje/semana/mes" }
   Exemplos: "Quantas peças João produziu?", "Produção de Maria hoje"

3. "status_of" - Status de uma OF específica
   Params: { "ofCodigo": "011593" }
   Exemplos: "Qual o status da OF 011593?", "A ordem 011593 está concluída?"

4. "ofs_abertas" - Listar OFs em aberto
   Params: {}
   Exemplos: "Quais OFs estão abertas?", "Mostre ordens pendentes"

5. "tempo_processo" - Tempo médio por processo
   Params: { "processo": "Casear", "ofCodigo": "011593" (opcional) }
   Exemplos: "Quanto tempo leva para casear?", "Tempo médio de caseamento"

6. "ranking_producao" - Usuários mais produtivos
   Params: { "processo": "Casear" (opcional), "periodo": "hoje/semana/mes" }
   Exemplos: "Quem produziu mais hoje?", "Ranking de caseamento"

7. "resumo_of" - Resumo completo de uma OF
   Params: { "ofCodigo": "011593" }
   Exemplos: "Me fale sobre a OF 011593", "Resumo da ordem 011593"

REGRAS IMPORTANTES:
- Códigos de OF sempre têm 6 dígitos (ex: 011593)
- Nomes de processos: Casear, Costurar, Pregar Botão, Pregar Etiqueta, Empacotar, Revisar
- Se não entender a pergunta, retorne queryType: "unknown"
- Seja flexível com variações (OF/ordem/fabricação, casear/caseamento/botão)
- Para perguntas genéricas sem parâmetros específicos, use needsData: true e params vazios

EXEMPLOS DE ANÁLISE:

Pergunta: "Quem caseou a OF 011593?"
Resposta: {
  "queryType": "atividades_por_of",
  "params": { "ofCodigo": "011593", "processo": "Casear" },
  "needsData": true,
  "interpretation": "Buscar usuários que executaram o processo Casear na OF 011593"
}

Pergunta: "Quantas peças Maria produziu hoje?"
Resposta: {
  "queryType": "producao_usuario",
  "params": { "usuarioNome": "Maria", "periodo": "hoje" },
  "needsData": true,
  "interpretation": "Contar total de peças produzidas por Maria nas últimas 24 horas"
}

Pergunta: "Qual o status da ordem 011079?"
Resposta: {
  "queryType": "status_of",
  "params": { "ofCodigo": "011079" },
  "needsData": true,
  "interpretation": "Verificar status atual da OF 011079"
}

Seja preciso e objetivo. Retorne APENAS o JSON, sem texto adicional.`;

// =====================================================
// Função: Analisar pergunta do usuário com GPT
// =====================================================

async function analyzeQuery(userQuery) {
  try {
    console.log('🤖 Analisando pergunta com GPT:', userQuery);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Modelo mais econômico e rápido
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userQuery }
      ],
      temperature: 0.3, // Respostas mais precisas e consistentes
      max_tokens: 500
    });

    const responseText = completion.choices[0].message.content.trim();
    console.log('📝 Resposta do GPT:', responseText);

    // Parse do JSON retornado
    const analysis = JSON.parse(responseText);
    console.log('✅ Análise parseada:', JSON.stringify(analysis, null, 2));

    return analysis;

  } catch (error) {
    console.error('❌ Erro ao analisar query com GPT:', error);
    throw new Error('Não consegui entender sua pergunta. Tente reformular.');
  }
}

// =====================================================
// Funções de Consulta ao Banco de Dados
// =====================================================

// 1. Atividades por OF
async function getAtividadesPorOF(params) {
  const { ofCodigo, processo } = params;

  // Buscar OF pelo código
  const { data: of, error: ofError } = await supabaseAdmin
    .from('ofs')
    .select('id, codigo, referencia, descricao, quantidade, status')
    .eq('codigo', ofCodigo)
    .single();

  if (ofError || !of) {
    return { found: false, message: `OF ${ofCodigo} não encontrada.` };
  }

  // Buscar atividades da OF
  let query = supabaseAdmin
    .from('activities')
    .select(`
      id,
      pieces_completed,
      started_at,
      finished_at,
      duration_seconds,
      users:user_id (nome, matricula),
      processes:process_id (name)
    `)
    .eq('of_id', of.id);

  // Filtrar por processo se especificado
  if (processo) {
    const { data: processData } = await supabaseAdmin
      .from('processes')
      .select('id')
      .ilike('name', `%${processo}%`)
      .single();

    if (processData) {
      query = query.eq('process_id', processData.id);
    }
  }

  const { data: atividades, error: atividadesError } = await query.order('started_at', { ascending: false });

  if (atividadesError) {
    console.error('Erro ao buscar atividades:', atividadesError);
    return { found: false, message: 'Erro ao buscar atividades.' };
  }

  return {
    found: true,
    of,
    atividades: atividades || [],
    totalAtividades: atividades?.length || 0,
    totalPecas: atividades?.reduce((sum, a) => sum + (a.pieces_completed || 0), 0) || 0
  };
}

// 2. Produção de usuário
async function getProducaoUsuario(params) {
  const { usuarioNome, processo, periodo } = params;

  // Calcular data de início baseado no período
  let dataInicio = new Date();
  if (periodo === 'hoje') {
    dataInicio.setHours(0, 0, 0, 0);
  } else if (periodo === 'semana') {
    dataInicio.setDate(dataInicio.getDate() - 7);
  } else if (periodo === 'mes') {
    dataInicio.setMonth(dataInicio.getMonth() - 1);
  }

  // Buscar usuário
  const { data: usuario, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, nome, matricula')
    .ilike('nome', `%${usuarioNome}%`)
    .single();

  if (userError || !usuario) {
    return { found: false, message: `Usuário "${usuarioNome}" não encontrado.` };
  }

  // Buscar atividades do usuário
  let query = supabaseAdmin
    .from('activities')
    .select(`
      id,
      pieces_completed,
      started_at,
      finished_at,
      duration_seconds,
      processes:process_id (name),
      ofs:of_id (codigo)
    `)
    .eq('user_id', usuario.id)
    .gte('started_at', dataInicio.toISOString());

  // Filtrar por processo se especificado
  if (processo) {
    const { data: processData } = await supabaseAdmin
      .from('processes')
      .select('id')
      .ilike('name', `%${processo}%`)
      .single();

    if (processData) {
      query = query.eq('process_id', processData.id);
    }
  }

  const { data: atividades, error: atividadesError } = await query.order('started_at', { ascending: false });

  if (atividadesError) {
    console.error('Erro ao buscar atividades do usuário:', atividadesError);
    return { found: false, message: 'Erro ao buscar produção do usuário.' };
  }

  return {
    found: true,
    usuario,
    periodo,
    atividades: atividades || [],
    totalAtividades: atividades?.length || 0,
    totalPecas: atividades?.reduce((sum, a) => sum + (a.pieces_completed || 0), 0) || 0,
    tempoTotal: atividades?.reduce((sum, a) => sum + (a.duration_seconds || 0), 0) || 0
  };
}

// 3. Status de OF
async function getStatusOF(params) {
  const { ofCodigo } = params;

  const { data: of, error } = await supabaseAdmin
    .from('ofs')
    .select('id, codigo, referencia, descricao, quantidade, status, created_at')
    .eq('codigo', ofCodigo)
    .single();

  if (error || !of) {
    return { found: false, message: `OF ${ofCodigo} não encontrada.` };
  }

  // Contar atividades e peças produzidas
  const { data: atividades } = await supabaseAdmin
    .from('activities')
    .select('pieces_completed')
    .eq('of_id', of.id);

  const totalPecasProduzidas = atividades?.reduce((sum, a) => sum + (a.pieces_completed || 0), 0) || 0;
  const progresso = of.quantidade > 0 ? ((totalPecasProduzidas / of.quantidade) * 100).toFixed(1) : 0;

  return {
    found: true,
    of: {
      ...of,
      totalPecasProduzidas,
      progresso: `${progresso}%`
    }
  };
}

// 4. OFs abertas
async function getOFsAbertas() {
  const { data: ofs, error } = await supabaseAdmin
    .from('ofs')
    .select('id, codigo, referencia, descricao, quantidade, status, created_at')
    .eq('status', 'aberta')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar OFs abertas:', error);
    return { found: false, message: 'Erro ao buscar OFs abertas.' };
  }

  return {
    found: true,
    ofs: ofs || [],
    total: ofs?.length || 0
  };
}

// 5. Tempo médio por processo
async function getTempoProcesso(params) {
  const { processo, ofCodigo } = params;

  // Buscar processo
  const { data: processData, error: processError } = await supabaseAdmin
    .from('processes')
    .select('id, name')
    .ilike('name', `%${processo}%`)
    .single();

  if (processError || !processData) {
    return { found: false, message: `Processo "${processo}" não encontrado.` };
  }

  // Query base
  let query = supabaseAdmin
    .from('activities')
    .select('duration_seconds, pieces_completed')
    .eq('process_id', processData.id)
    .not('duration_seconds', 'is', null)
    .gt('duration_seconds', 0);

  // Filtrar por OF se especificado
  if (ofCodigo) {
    const { data: of } = await supabaseAdmin
      .from('ofs')
      .select('id')
      .eq('codigo', ofCodigo)
      .single();

    if (of) {
      query = query.eq('of_id', of.id);
    }
  }

  const { data: atividades, error } = await query;

  if (error || !atividades || atividades.length === 0) {
    return { found: false, message: `Nenhuma atividade encontrada para o processo "${processo}".` };
  }

  const tempoTotal = atividades.reduce((sum, a) => sum + a.duration_seconds, 0);
  const pecasTotal = atividades.reduce((sum, a) => sum + (a.pieces_completed || 0), 0);
  const tempoMedio = tempoTotal / atividades.length;
  const tempoPorPeca = pecasTotal > 0 ? tempoTotal / pecasTotal : 0;

  return {
    found: true,
    processo: processData.name,
    totalAtividades: atividades.length,
    tempoMedioSegundos: Math.round(tempoMedio),
    tempoMedioFormatado: formatarTempo(tempoMedio),
    tempoPorPecaSegundos: Math.round(tempoPorPeca),
    tempoPorPecaFormatado: formatarTempo(tempoPorPeca)
  };
}

// 6. Ranking de produção
async function getRankingProducao(params) {
  const { processo, periodo } = params;

  // Calcular data de início
  let dataInicio = new Date();
  if (periodo === 'hoje') {
    dataInicio.setHours(0, 0, 0, 0);
  } else if (periodo === 'semana') {
    dataInicio.setDate(dataInicio.getDate() - 7);
  } else if (periodo === 'mes') {
    dataInicio.setMonth(dataInicio.getMonth() - 1);
  }

  // Query base
  let query = supabaseAdmin
    .from('activities')
    .select(`
      user_id,
      pieces_completed,
      users:user_id (nome, matricula)
    `)
    .gte('started_at', dataInicio.toISOString());

  // Filtrar por processo se especificado
  if (processo) {
    const { data: processData } = await supabaseAdmin
      .from('processes')
      .select('id')
      .ilike('name', `%${processo}%`)
      .single();

    if (processData) {
      query = query.eq('process_id', processData.id);
    }
  }

  const { data: atividades, error } = await query;

  if (error || !atividades || atividades.length === 0) {
    return { found: false, message: 'Nenhuma atividade encontrada no período.' };
  }

  // Agrupar por usuário
  const producaoPorUsuario = {};
  atividades.forEach(a => {
    const userId = a.user_id;
    if (!producaoPorUsuario[userId]) {
      producaoPorUsuario[userId] = {
        usuario: a.users.nome,
        matricula: a.users.matricula,
        totalPecas: 0,
        totalAtividades: 0
      };
    }
    producaoPorUsuario[userId].totalPecas += a.pieces_completed || 0;
    producaoPorUsuario[userId].totalAtividades += 1;
  });

  // Converter para array e ordenar
  const ranking = Object.values(producaoPorUsuario)
    .sort((a, b) => b.totalPecas - a.totalPecas)
    .slice(0, 10); // Top 10

  return {
    found: true,
    periodo,
    processo: processo || 'Todos',
    ranking
  };
}

// 7. Resumo completo de OF
async function getResumoOF(params) {
  const { ofCodigo } = params;

  // Buscar OF
  const { data: of, error: ofError } = await supabaseAdmin
    .from('ofs')
    .select('*')
    .eq('codigo', ofCodigo)
    .single();

  if (ofError || !of) {
    return { found: false, message: `OF ${ofCodigo} não encontrada.` };
  }

  // Buscar atividades com detalhes
  const { data: atividades } = await supabaseAdmin
    .from('activities')
    .select(`
      id,
      pieces_completed,
      duration_seconds,
      started_at,
      finished_at,
      users:user_id (nome),
      processes:process_id (name)
    `)
    .eq('of_id', of.id)
    .order('started_at', { ascending: false });

  // Calcular estatísticas
  const totalPecas = atividades?.reduce((sum, a) => sum + (a.pieces_completed || 0), 0) || 0;
  const totalTempo = atividades?.reduce((sum, a) => sum + (a.duration_seconds || 0), 0) || 0;
  const progresso = of.quantidade > 0 ? ((totalPecas / of.quantidade) * 100).toFixed(1) : 0;

  // Agrupar por processo
  const porProcesso = {};
  atividades?.forEach(a => {
    const processo = a.processes?.name || 'Desconhecido';
    if (!porProcesso[processo]) {
      porProcesso[processo] = { pecas: 0, atividades: 0 };
    }
    porProcesso[processo].pecas += a.pieces_completed || 0;
    porProcesso[processo].atividades += 1;
  });

  return {
    found: true,
    of,
    estatisticas: {
      totalAtividades: atividades?.length || 0,
      totalPecasProduzidas: totalPecas,
      quantidadeTotal: of.quantidade,
      progresso: `${progresso}%`,
      tempoTotal: formatarTempo(totalTempo),
      status: of.status
    },
    porProcesso,
    ultimasAtividades: atividades?.slice(0, 5) || []
  };
}

// =====================================================
// Função: Executar consulta baseada na análise do GPT
// =====================================================

async function executeQuery(analysis) {
  const { queryType, params } = analysis;

  console.log('🔍 Executando query:', queryType, 'com params:', params);

  try {
    switch (queryType) {
      case 'atividades_por_of':
        return await getAtividadesPorOF(params);

      case 'producao_usuario':
        return await getProducaoUsuario(params);

      case 'status_of':
        return await getStatusOF(params);

      case 'ofs_abertas':
        return await getOFsAbertas();

      case 'tempo_processo':
        return await getTempoProcesso(params);

      case 'ranking_producao':
        return await getRankingProducao(params);

      case 'resumo_of':
        return await getResumoOF(params);

      case 'unknown':
        return {
          found: false,
          message: 'Desculpe, não consegui entender sua pergunta. Tente ser mais específico.'
        };

      default:
        return {
          found: false,
          message: 'Tipo de consulta não implementado.'
        };
    }
  } catch (error) {
    console.error('❌ Erro ao executar query:', error);
    return {
      found: false,
      message: 'Erro ao consultar dados do sistema.'
    };
  }
}

// =====================================================
// Função: Formular resposta final com GPT
// =====================================================

async function formulateResponse(userQuery, data) {
  try {
    console.log('🤖 Formulando resposta com GPT...');

    const dataContext = data.found
      ? `Dados encontrados:\n${JSON.stringify(data, null, 2)}`
      : `Dados não encontrados: ${data.message}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente amigável de um sistema de gestão de acabamento.

Sua tarefa é transformar os dados técnicos em uma resposta natural e amigável em português.

INSTRUÇÕES:
- Seja objetivo e direto
- Use linguagem natural e amigável
- Formate números (ex: "52 peças", "3 atividades")
- Se não houver dados, seja educado e sugira alternativas
- Não invente informações que não estão nos dados
- Para rankings, liste os top 5
- Para atividades, resuma as principais informações`
        },
        {
          role: 'user',
          content: `Pergunta do usuário: "${userQuery}"\n\n${dataContext}\n\nFormule uma resposta natural e amigável.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content.trim();
    console.log('✅ Resposta formulada:', response);

    return response;

  } catch (error) {
    console.error('❌ Erro ao formular resposta:', error);

    // Fallback: resposta baseada apenas nos dados
    if (data.found) {
      return 'Encontrei os dados, mas tive dificuldade em formular a resposta. Por favor, tente novamente.';
    } else {
      return data.message || 'Não consegui encontrar informações para responder sua pergunta.';
    }
  }
}

// =====================================================
// Função principal: Processar pergunta completa
// =====================================================

async function processUserQuery(userQuery) {
  try {
    // 1. Analisar pergunta com GPT
    const analysis = await analyzeQuery(userQuery);

    // 2. Executar consulta no banco se necessário
    let data = { found: false, message: 'Nenhum dado necessário.' };
    if (analysis.needsData) {
      data = await executeQuery(analysis);
    }

    // 3. Formular resposta final com GPT
    const response = await formulateResponse(userQuery, data);

    return {
      success: true,
      response,
      debug: {
        analysis,
        dataFound: data.found
      }
    };

  } catch (error) {
    console.error('❌ Erro ao processar pergunta:', error);
    return {
      success: false,
      response: 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.',
      error: error.message
    };
  }
}

// =====================================================
// Funções auxiliares
// =====================================================

function formatarTempo(segundos) {
  if (!segundos || segundos === 0) return '0s';

  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = Math.floor(segundos % 60);

  const partes = [];
  if (horas > 0) partes.push(`${horas}h`);
  if (minutos > 0) partes.push(`${minutos}min`);
  if (segs > 0 || partes.length === 0) partes.push(`${segs}s`);

  return partes.join(' ');
}

// =====================================================
// Exports
// =====================================================

module.exports = {
  processUserQuery,
  analyzeQuery,
  executeQuery,
  formulateResponse
};
