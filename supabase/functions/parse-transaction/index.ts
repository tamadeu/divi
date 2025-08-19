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