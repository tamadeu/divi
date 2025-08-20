import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VoiceTransactionRequest {
  audio_data?: string;
  audio_type?: string;
  text?: string;
  workspace_id: string;
}

interface TransactionData {
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  category_id?: string;
  description?: string;
  date?: string;
}

interface AIRequestLog {
  user_id: string;
  workspace_id: string;
  transaction_id?: string;
  input_text: string;
  ai_provider: string;
  ai_model?: string;
  ai_response?: string;
  processing_time_ms: number;
  cost_usd?: number;
  tokens_input?: number;
  tokens_output?: number;
  success: boolean;
  error_message?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { audio_data, audio_type, text, workspace_id }: VoiceTransactionRequest = await req.json()
    
    if (!workspace_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'workspace_id é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!audio_data && !text) {
      return new Response(
        JSON.stringify({ success: false, error: 'audio_data ou text são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Processando áudio/texto para workspace:', workspace_id)

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obter informações do usuário
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token de autorização necessário' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuário não autenticado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Buscar categorias do workspace para ajudar na classificação
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, type')
      .eq('workspace_id', workspace_id)

    const categoryNames = categories?.map(c => c.name) || []
    const expenseCategories = categories?.filter(c => c.type === 'expense').map(c => ({ id: c.id, name: c.name })) || []
    const incomeCategories = categories?.filter(c => c.type === 'income').map(c => ({ id: c.id, name: c.name })) || []

    let transcribedText = text || '';

    // Se temos áudio, primeiro precisamos transcrever
    if (audio_data) {
      console.log('Transcrevendo áudio...')
      const transcriptionResult = await transcribeAudio(audio_data, audio_type || 'audio/webm', user.id, workspace_id, supabase)
      
      if (!transcriptionResult.success) {
        return new Response(
          JSON.stringify({ success: false, error: 'Não foi possível transcrever o áudio' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      transcribedText = transcriptionResult.text
      console.log('Texto transcrito:', transcribedText)
    }

    // Preparar prompt melhorado para IA
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const prompt = `
Você é um assistente especializado em processar transações financeiras por voz em português brasileiro.

Data atual: ${today.toISOString().split('T')[0]} (hoje)
Data de ontem: ${yesterday.toISOString().split('T')[0]} (ontem)

Analise o seguinte texto transcrito de áudio e extraia as informações de uma transação financeira:
"${transcribedText}"

Categorias de despesa disponíveis: ${expenseCategories.map(c => `"${c.name}" (ID: ${c.id})`).join(', ')}
Categorias de receita disponíveis: ${incomeCategories.map(c => `"${c.name}" (ID: ${c.id})`).join(', ')}

Retorne APENAS um JSON válido com a seguinte estrutura:
{
  "name": "nome da transação (ex: Uber, Salário, Supermercado)",
  "amount": número positivo (ex: 50.00),
  "type": "expense" ou "income",
  "category_name": "nome exato da categoria da lista disponível ou null se não encontrar",
  "category_id": "ID da categoria correspondente ou null",
  "description": "descrição adicional se houver ou null",
  "date": "data no formato YYYY-MM-DD ou null para usar hoje"
}

Regras importantes:
- Se mencionar "gastei", "paguei", "comprei" = expense
- Se mencionar "recebi", "ganhei", "salário" = income  
- Extraia valores numéricos: "50 reais" = 50.00, "49 e 58" = 49.58
- Use EXATAMENTE o nome da categoria da lista ou null
- Para datas: "hoje" = ${today.toISOString().split('T')[0]}, "ontem" = ${yesterday.toISOString().split('T')[0]}
- Se mencionar "segunda", "terça", etc, calcule a data mais próxima
- Nome deve ser conciso (máximo 3 palavras)
- Não inclua explicações, apenas o JSON válido
`

    // Tentar usar diferentes provedores de IA
    let aiResult: { success: boolean; transaction?: TransactionData; error?: string } = { success: false }
    
    // Tentar Gemini primeiro
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (geminiApiKey && !aiResult.success) {
      aiResult = await processWithGemini(prompt, transcribedText, user.id, workspace_id, supabase)
    }

    // Tentar OpenAI se Gemini falhar
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (openaiApiKey && !aiResult.success) {
      aiResult = await processWithOpenAI(prompt, transcribedText, user.id, workspace_id, supabase)
    }

    // Tentar Anthropic se outros falharem
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (anthropicApiKey && !aiResult.success) {
      aiResult = await processWithAnthropic(prompt, transcribedText, user.id, workspace_id, supabase)
    }

    if (!aiResult.success) {
      // Fallback: processamento simples baseado em regras
      console.log('Usando fallback de processamento simples')
      const transaction = processWithFallback(transcribedText, categories || [])
      
      // Log do fallback
      await logAIRequest({
        user_id: user.id,
        workspace_id,
        input_text: transcribedText,
        ai_provider: 'fallback',
        ai_response: JSON.stringify(transaction),
        processing_time_ms: 0,
        success: true
      }, supabase)
      
      return new Response(
        JSON.stringify({ success: true, transaction }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mapear categoria_name para category_id se necessário
    if (aiResult.transaction && aiResult.transaction.category && !aiResult.transaction.category_id) {
      const matchedCategory = categories?.find(c => 
        c.name.toLowerCase() === aiResult.transaction!.category!.toLowerCase()
      )
      if (matchedCategory) {
        aiResult.transaction.category_id = matchedCategory.id
      }
    }

    return new Response(
      JSON.stringify({ success: true, transaction: aiResult.transaction }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro geral:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor: ' + error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Função para processar com Gemini
async function processWithGemini(prompt: string, inputText: string, userId: string, workspaceId: string, supabase: any) {
  const startTime = Date.now()
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!
  
  try {
    console.log('Tentando Gemini...')
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500
          }
        })
      }
    )

    const processingTime = Date.now() - startTime
    const responseData = await response.json()

    if (response.ok && responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
      const aiResponse = responseData.candidates[0].content.parts[0].text
      console.log('Resposta do Gemini:', aiResponse)
      
      const transaction = parseAIResponse(aiResponse)
      
      // Log da requisição bem-sucedida
      await logAIRequest({
        user_id: userId,
        workspace_id: workspaceId,
        input_text: inputText,
        ai_provider: 'gemini',
        ai_model: 'gemini-1.5-flash',
        ai_response: aiResponse,
        processing_time_ms: processingTime,
        tokens_input: responseData.usageMetadata?.promptTokenCount,
        tokens_output: responseData.usageMetadata?.candidatesTokenCount,
        success: true
      }, supabase)
      
      return { success: true, transaction }
    } else {
      throw new Error('Resposta inválida do Gemini')
    }
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('Erro no Gemini:', error)
    
    // Log do erro
    await logAIRequest({
      user_id: userId,
      workspace_id: workspaceId,
      input_text: inputText,
      ai_provider: 'gemini',
      ai_model: 'gemini-1.5-flash',
      processing_time_ms: processingTime,
      success: false,
      error_message: error.message
    }, supabase)
    
    return { success: false, error: error.message }
  }
}

// Função para processar com OpenAI
async function processWithOpenAI(prompt: string, inputText: string, userId: string, workspaceId: string, supabase: any) {
  const startTime = Date.now()
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!
  
  try {
    console.log('Tentando OpenAI...')
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500
      })
    })

    const processingTime = Date.now() - startTime
    const responseData = await response.json()

    if (response.ok && responseData.choices?.[0]?.message?.content) {
      const aiResponse = responseData.choices[0].message.content
      console.log('Resposta do OpenAI:', aiResponse)
      
      const transaction = parseAIResponse(aiResponse)
      
      // Calcular custo aproximado (GPT-3.5-turbo: $0.0015/1K input tokens, $0.002/1K output tokens)
      const inputTokens = responseData.usage?.prompt_tokens || 0
      const outputTokens = responseData.usage?.completion_tokens || 0
      const cost = (inputTokens * 0.0015 / 1000) + (outputTokens * 0.002 / 1000)
      
      // Log da requisição bem-sucedida
      await logAIRequest({
        user_id: userId,
        workspace_id: workspaceId,
        input_text: inputText,
        ai_provider: 'openai',
        ai_model: 'gpt-3.5-turbo',
        ai_response: aiResponse,
        processing_time_ms: processingTime,
        cost_usd: cost,
        tokens_input: inputTokens,
        tokens_output: outputTokens,
        success: true
      }, supabase)
      
      return { success: true, transaction }
    } else {
      throw new Error('Resposta inválida do OpenAI')
    }
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('Erro no OpenAI:', error)
    
    // Log do erro
    await logAIRequest({
      user_id: userId,
      workspace_id: workspaceId,
      input_text: inputText,
      ai_provider: 'openai',
      ai_model: 'gpt-3.5-turbo',
      processing_time_ms: processingTime,
      success: false,
      error_message: error.message
    }, supabase)
    
    return { success: false, error: error.message }
  }
}

// Função para processar com Anthropic
async function processWithAnthropic(prompt: string, inputText: string, userId: string, workspaceId: string, supabase: any) {
  const startTime = Date.now()
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!
  
  try {
    console.log('Tentando Anthropic...')
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const processingTime = Date.now() - startTime
    const responseData = await response.json()

    if (response.ok && responseData.content?.[0]?.text) {
      const aiResponse = responseData.content[0].text
      console.log('Resposta do Anthropic:', aiResponse)
      
      const transaction = parseAIResponse(aiResponse)
      
      // Calcular custo aproximado (Claude Haiku: $0.25/1M input tokens, $1.25/1M output tokens)
      const inputTokens = responseData.usage?.input_tokens || 0
      const outputTokens = responseData.usage?.output_tokens || 0
      const cost = (inputTokens * 0.25 / 1000000) + (outputTokens * 1.25 / 1000000)
      
      // Log da requisição bem-sucedida
      await logAIRequest({
        user_id: userId,
        workspace_id: workspaceId,
        input_text: inputText,
        ai_provider: 'anthropic',
        ai_model: 'claude-3-haiku-20240307',
        ai_response: aiResponse,
        processing_time_ms: processingTime,
        cost_usd: cost,
        tokens_input: inputTokens,
        tokens_output: outputTokens,
        success: true
      }, supabase)
      
      return { success: true, transaction }
    } else {
      throw new Error('Resposta inválida do Anthropic')
    }
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('Erro no Anthropic:', error)
    
    // Log do erro
    await logAIRequest({
      user_id: userId,
      workspace_id: workspaceId,
      input_text: inputText,
      ai_provider: 'anthropic',
      ai_model: 'claude-3-haiku-20240307',
      processing_time_ms: processingTime,
      success: false,
      error_message: error.message
    }, supabase)
    
    return { success: false, error: error.message }
  }
}

// Função para transcrever áudio usando OpenAI Whisper
async function transcribeAudio(audioBase64: string, audioType: string, userId: string, workspaceId: string, supabase: any) {
  const startTime = Date.now()
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    console.log('OpenAI API key não encontrada para transcrição')
    return { success: false, text: '' }
  }

  try {
    // Converter base64 para blob
    const audioBuffer = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))
    
    // Criar FormData para enviar para Whisper
    const formData = new FormData()
    const audioFile = new File([audioBuffer], 'audio.webm', { type: audioType })
    formData.append('file', audioFile)
    formData.append('model', 'whisper-1')
    formData.append('language', 'pt')
    formData.append('response_format', 'text')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData
    })

    const processingTime = Date.now() - startTime

    if (response.ok) {
      const transcription = await response.text()
      console.log('Transcrição do Whisper:', transcription)
      
      // Calcular custo aproximado (Whisper: $0.006/minuto)
      // Estimativa baseada no tamanho do arquivo (muito aproximada)
      const estimatedMinutes = Math.max(0.1, audioBuffer.length / (1024 * 1024 * 2)) // Estimativa grosseira
      const cost = estimatedMinutes * 0.006
      
      // Log da transcrição
      await logAIRequest({
        user_id: userId,
        workspace_id: workspaceId,
        input_text: `[ÁUDIO: ${audioBuffer.length} bytes]`,
        ai_provider: 'openai',
        ai_model: 'whisper-1',
        ai_response: transcription,
        processing_time_ms: processingTime,
        cost_usd: cost,
        success: true
      }, supabase)
      
      return { success: true, text: transcription.trim() }
    } else {
      throw new Error('Erro na transcrição: ' + await response.text())
    }
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('Erro ao transcrever áudio:', error)
    
    // Log do erro de transcrição
    await logAIRequest({
      user_id: userId,
      workspace_id: workspaceId,
      input_text: `[ÁUDIO: erro na transcrição]`,
      ai_provider: 'openai',
      ai_model: 'whisper-1',
      processing_time_ms: processingTime,
      success: false,
      error_message: error.message
    }, supabase)
    
    return { success: false, text: '' }
  }
}

// Função para fazer log das requisições de IA
async function logAIRequest(logData: AIRequestLog, supabase: any) {
  try {
    const { error } = await supabase
      .from('ai_request_logs')
      .insert(logData)
    
    if (error) {
      console.error('Erro ao salvar log de IA:', error)
    }
  } catch (error) {
    console.error('Erro ao salvar log de IA:', error)
  }
}

// Função para parsear resposta da IA
function parseAIResponse(aiResponse: string): TransactionData {
  // Limpar a resposta para extrair apenas o JSON
  let cleanResponse = aiResponse.trim()
  
  // Remover markdown se presente
  if (cleanResponse.includes('```json')) {
    cleanResponse = cleanResponse.split('```json')[1].split('```')[0].trim()
  } else if (cleanResponse.includes('```')) {
    cleanResponse = cleanResponse.split('```')[1].split('```')[0].trim()
  }
  
  // Tentar encontrar JSON na resposta
  const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    cleanResponse = jsonMatch[0]
  }

  console.log('JSON limpo:', cleanResponse)
  
  const transaction: TransactionData = JSON.parse(cleanResponse)
  
  // Validar dados essenciais
  if (!transaction.name || !transaction.amount || !transaction.type) {
    throw new Error('Dados essenciais faltando na resposta da IA')
  }

  // Garantir que amount seja positivo
  transaction.amount = Math.abs(transaction.amount)

  // Validar tipo
  if (!['income', 'expense'].includes(transaction.type)) {
    transaction.type = 'expense' // default
  }

  return transaction
}

// Função de fallback para processamento simples baseado em regras
function processWithFallback(text: string, categories: any[]): TransactionData {
  const lowerText = text.toLowerCase()
  
  // Detectar tipo
  const isExpense = /\b(gastei|paguei|comprei|despesa|gasto|pago)\b/.test(lowerText)
  const isIncome = /\b(recebi|ganhei|salário|renda|recebimento)\b/.test(lowerText)
  
  const type: 'income' | 'expense' = isIncome ? 'income' : 'expense'
  
  // Extrair valor
  const amountMatch = text.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:reais?|r\$|brl)?/i)
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 10.00
  
  // Extrair nome (palavras importantes)
  let name = 'Transação'
  const commonWords = ['gastei', 'paguei', 'comprei', 'recebi', 'ganhei', 'reais', 'hoje', 'ontem', 'no', 'na', 'com', 'de', 'para', 'em']
  const words = text.split(' ').filter(word => 
    word.length > 2 && 
    !commonWords.includes(word.toLowerCase()) &&
    !/^\d+/.test(word)
  )
  
  if (words.length > 0) {
    name = words.slice(0, 2).join(' ')
  }
  
  // Tentar encontrar categoria
  let category = null
  let category_id = null
  for (const cat of categories) {
    if (lowerText.includes(cat.name.toLowerCase())) {
      category = cat.name
      category_id = cat.id
      break
    }
  }
  
  // Processar datas
  let date = null
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (/\bhoje\b/.test(lowerText)) {
    date = today.toISOString().split('T')[0]
  } else if (/\bontem\b/.test(lowerText)) {
    date = yesterday.toISOString().split('T')[0]
  }
  
  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    amount,
    type,
    category,
    category_id,
    description: `Processado por voz: "${text}"`,
    date
  }
}