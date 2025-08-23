import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.15.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to call Gemini API
async function callGemini(prompt: string, apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })
  const result = await model.generateContent(prompt)
  const response = await result.response
  const responseText = response.text().replace(/```json/g, '').replace(/```/g, '').trim()
  try {
    return JSON.parse(responseText)
  } catch (e) {
    throw new Error(`Gemini retornou uma resposta em formato inválido.`)
  }
}

// Helper function to call OpenAI API
async function callOpenAI(prompt: string, apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    }),
  })
  if (!response.ok) {
    throw new Error(`A API da OpenAI respondeu com um erro.`);
  }
  const data = await response.json()
  try {
    return JSON.parse(data.choices[0].message.content)
  } catch (e) {
    throw new Error(`OpenAI retornou uma resposta em formato inválido.`)
  }
}

// Helper function to call Anthropic API
async function callAnthropic(prompt: string, apiKey: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!response.ok) {
    throw new Error(`A API da Anthropic respondeu com um erro.`);
  }
  const data = await response.json()
  const responseText = data.content[0].text.replace(/```json/g, '').replace(/```/g, '').trim()
  try {
    return JSON.parse(responseText)
  } catch (e) {
    throw new Error(`Anthropic retornou uma resposta em formato inválido.`)
  }
}

interface AIRequestLog {
  user_id: string;
  workspace_id: string;
  transaction_id?: string | null; // Made optional and nullable
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Sessão inválida. Por favor, faça login novamente.')

    const { text } = await req.json()
    if (!text) throw new Error('Nenhum texto foi recebido para análise.')

    const { data: accounts, error: accountsError } = await supabaseClient.from('accounts').select('id, name, type, is_default')
    const { data: categories, error: categoriesError } = await supabaseClient.from('categories').select('id, name, type')
    if (accountsError || categoriesError) throw new Error('Não foi possível carregar suas contas e categorias.')

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!geminiApiKey && !openaiApiKey && !anthropicApiKey) {
      throw new Error("A funcionalidade de voz não está configurada no servidor.");
    }
    
    const today = new Date().toISOString().split('T')[0];

    const basePrompt = `
      Você é um assistente financeiro que preenche um formulário JSON a partir de um texto.
      O texto do usuário é: "${text}"
      A data de hoje é: ${today}.

      **REGRA MAIS IMPORTANTE:** Se o texto contiver "hoje", a data no JSON DEVE ser "${today}". Esta regra é inquebrável.

      **Contas disponíveis:**
      ${JSON.stringify(accounts, null, 2)}

      **Categorias disponíveis:**
      ${JSON.stringify(categories, null, 2)}

      **Sua Tarefa:**
      Preencha o seguinte formulário JSON com base no texto do usuário e nas listas acima.

      **Formulário JSON (preencha os valores):**
      {
        "name": "...",
        "amount": 0,
        "type": "expense",
        "date": "YYYY-MM-DD",
        "account_id": null,
        "category_id": null,
        "new_account_name": null,
        "new_account_type": null,
        "new_category_name": null
      }

      **Instruções para preenchimento:**
      1.  **name**: Um nome curto para a transação (ex: "Uber", "Salário").
      2.  **amount**: O valor numérico, sempre positivo.
      3.  **type**: "expense" para gastos, "income" para ganhos.
      4.  **date**: Siga a **REGRA MAIS IMPORTANTE**. Se outra data for mencionada, use-a.
      5.  **account_id**:
          - Se o usuário mencionar uma conta que **existe** na lista, use o "id" dela.
          - Se o usuário mencionar um tipo de conta (ex: "cartão de crédito") que **não existe** na lista, deixe "account_id" como \`null\` e preencha "new_account_name" e "new_account_type".
          - Se nenhuma conta for mencionada, use a conta padrão (\`is_default: true\`).
      6.  **category_id**:
          - Use o "id" da categoria mais apropriada da lista.
          - Se nenhuma for adequada, deixe "category_id" como \`null\` e preencha "new_category_name".

      Retorne APENAS o objeto JSON preenchido.
    `
    
    let parsedData = null;
    const errors = [];

    if (geminiApiKey) {
      try {
        console.log("Tentando com Gemini...");
        parsedData = await callGemini(basePrompt, geminiApiKey);
      } catch (error) {
        console.error("Erro com Gemini:", error.message);
        errors.push(`Gemini: ${error.message}`);
      }
    }

    if (!parsedData && openaiApiKey) {
      try {
        console.log("Tentando com OpenAI...");
        parsedData = await callOpenAI(basePrompt, openaiApiKey);
      } catch (error) {
        console.error("Erro com OpenAI:", error.message);
        errors.push(`OpenAI: ${error.message}`);
      }
    }

    if (!parsedData && anthropicApiKey) {
      try {
        console.log("Tentando com Anthropic...");
        parsedData = await callAnthropic(basePrompt, anthropicApiKey);
      } catch (error) {
        console.error("Erro com Anthropic:", error.message);
        errors.push(`Anthropic: ${error.message}`);
      }
    }

    if (!parsedData) {
      console.error("Todos os provedores de IA falharam:", errors);
      throw new Error("A IA não conseguiu processar sua solicitação. Tente novamente mais tarde.");
    }

    if (parsedData.category_id === null && parsedData.new_category_name) {
      const { data: newCategory } = await supabaseClient.from('categories').insert({ name: parsedData.new_category_name, type: parsedData.type, user_id: user.id }).select('id').single()
      if (newCategory) parsedData.category_id = newCategory.id
    }

    if (parsedData.account_id === null && parsedData.new_account_name) {
      const { data: newAccount } = await supabaseClient.from('accounts').insert({ 
        name: parsedData.new_account_name, 
        type: parsedData.new_account_type || 'Outro', 
        bank: 'Desconhecido', 
        balance: 0, 
        user_id: user.id, 
        is_default: false 
      }).select('id').single()
      if (newAccount) parsedData.account_id = newAccount.id
    }

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Erro na Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
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

    const processingTime = Date.Now() - startTime

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