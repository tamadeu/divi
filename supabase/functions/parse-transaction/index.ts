import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.15.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const basePrompt = `
  Você é um assistente financeiro especialista em extrair dados de texto.
  Analise o texto do usuário e extraia as seguintes informações para uma transação financeira: nome, valor, tipo (income ou expense), data, categoria e conta.
  
  Regras:
  1.  **Tipo**: Se o texto indicar um gasto, use "expense". Se indicar um ganho, use "income".
  2.  **Nome**: Crie um nome curto e descritivo para a transação.
  3.  **Valor**: Extraia o valor numérico.
  4.  **Data**: Se o usuário mencionar "hoje", use a data atual. Se mencionar outra data, use-a. Se não mencionar, use a data atual. Formato YYYY-MM-DD.
  5.  **Conta**: Associe a transação à conta mais relevante das disponíveis. Se o usuário mencionar um tipo de conta que não existe (ex: "cartão novo"), defina "account_id" como null e "new_account_name" com uma sugestão de nome.
  6.  **Categoria**: Associe a transação à categoria mais relevante. Se nenhuma categoria existente corresponder, defina "category_id" como null e "new_category_name" com uma sugestão de nome para a nova categoria.
  7.  **Resposta**: Retorne APENAS um objeto JSON válido com a seguinte estrutura:
      {
        "name": "string",
        "amount": number,
        "type": "income" | "expense",
        "date": "YYYY-MM-DD",
        "account_id": "uuid" | null,
        "category_id": "uuid" | null,
        "new_account_name": "string" | null,
        "new_category_name": "string" | null
      }
`

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
    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { text, provider = 'gemini' } = await req.json()
    if (!text) {
      return new Response(JSON.stringify({ error: 'Texto não fornecido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: accounts, error: accountsError } = await supabaseClient.from('accounts').select('id, name, type')
    const { data: categories, error: categoriesError } = await supabaseClient.from('categories').select('id, name, type')

    if (accountsError || categoriesError) {
      throw new Error('Erro ao buscar contas ou categorias')
    }

    let responseText = ''

    if (provider === 'openai') {
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
      if (!openaiApiKey) throw new Error('Chave da API da OpenAI não configurada')

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: basePrompt },
            { role: 'user', content: `O texto do usuário é: "${text}". As contas disponíveis são: ${JSON.stringify(accounts)}. As categorias disponíveis são: ${JSON.stringify(categories)}.` }
          ],
          response_format: { type: "json_object" }
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      responseText = data.choices[0].message.content

    } else { // Default to Gemini
      const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
      if (!geminiApiKey) throw new Error('Chave da API do Gemini não configurada')

      const genAI = new GoogleGenerativeAI(geminiApiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" })
      
      const prompt = `${basePrompt}\nO texto do usuário é: "${text}"\nAs contas disponíveis para este usuário são:\n${JSON.stringify(accounts)}\nAs categorias disponíveis são:\n${JSON.stringify(categories)}`
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      responseText = response.text().replace(/```json/g, '').replace(/```/g, '').trim()
    }
    
    const parsedData = JSON.parse(responseText)

    if (parsedData.category_id === null && parsedData.new_category_name) {
      const { data: newCategory } = await supabaseClient
        .from('categories')
        .insert({ name: parsedData.new_category_name, type: parsedData.type, user_id: user.id })
        .select('id')
        .single()
      if (newCategory) parsedData.category_id = newCategory.id
    }

    if (parsedData.account_id === null && parsedData.new_account_name) {
      const { data: newAccount } = await supabaseClient
        .from('accounts')
        .insert({ name: parsedData.new_account_name, type: 'Outro', bank: 'Desconhecido', balance: 0, user_id: user.id, is_default: false })
        .select('id')
        .single()
      if (newAccount) parsedData.account_id = newAccount.id
    }

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})