import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VoiceTransactionRequest {
  text: string;
  workspace_id: string;
}

interface TransactionData {
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  description?: string;
  date?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { text, workspace_id }: VoiceTransactionRequest = await req.json()
    
    if (!text || !workspace_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Texto e workspace_id são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Processando texto:', text)
    console.log('Workspace ID:', workspace_id)

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar categorias do workspace para ajudar na classificação
    const { data: categories } = await supabase
      .from('categories')
      .select('name, type')
      .eq('workspace_id', workspace_id)

    const categoryNames = categories?.map(c => c.name) || []
    const expenseCategories = categories?.filter(c => c.type === 'expense').map(c => c.name) || []
    const incomeCategories = categories?.filter(c => c.type === 'income').map(c => c.name) || []

    // Preparar prompt para IA
    const prompt = `
Você é um assistente especializado em processar transações financeiras por voz em português brasileiro.

Analise o seguinte texto e extraia as informações de uma transação financeira:
"${text}"

Categorias de despesa disponíveis: ${expenseCategories.join(', ')}
Categorias de receita disponíveis: ${incomeCategories.join(', ')}

Retorne APENAS um JSON válido com a seguinte estrutura:
{
  "name": "nome da transação (ex: Uber, Salário, Supermercado)",
  "amount": número positivo (ex: 50.00),
  "type": "expense" ou "income",
  "category": "categoria mais apropriada da lista disponível ou null se não encontrar",
  "description": "descrição adicional se houver ou null",
  "date": "data no formato ISO se mencionada ou null para usar hoje"
}

Regras:
- Se mencionar "gastei", "paguei", "comprei" = expense
- Se mencionar "recebi", "ganhei", "salário" = income  
- Extraia valores numéricos (50 reais = 50.00)
- Use a categoria mais próxima da lista ou null
- Nome deve ser conciso (máximo 3 palavras)
- Não inclua explicações, apenas o JSON
`

    // Tentar usar diferentes provedores de IA
    let aiResponse: string | null = null
    
    // Tentar Gemini primeiro
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (geminiApiKey && !aiResponse) {
      try {
        console.log('Tentando Gemini...')
        const geminiResponse = await fetch(
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

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json()
          aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
          console.log('Resposta do Gemini:', aiResponse)
        }
      } catch (error) {
        console.error('Erro no Gemini:', error)
      }
    }

    // Tentar OpenAI se Gemini falhar
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (openaiApiKey && !aiResponse) {
      try {
        console.log('Tentando OpenAI...')
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json()
          aiResponse = openaiData.choices?.[0]?.message?.content
          console.log('Resposta do OpenAI:', aiResponse)
        }
      } catch (error) {
        console.error('Erro no OpenAI:', error)
      }
    }

    // Tentar Anthropic se outros falharem
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (anthropicApiKey && !aiResponse) {
      try {
        console.log('Tentando Anthropic...')
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
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

        if (anthropicResponse.ok) {
          const anthropicData = await anthropicResponse.json()
          aiResponse = anthropicData.content?.[0]?.text
          console.log('Resposta do Anthropic:', aiResponse)
        }
      } catch (error) {
        console.error('Erro no Anthropic:', error)
      }
    }

    if (!aiResponse) {
      // Fallback: processamento simples baseado em regras
      console.log('Usando fallback de processamento simples')
      const transaction = processWithFallback(text, categoryNames)
      
      return new Response(
        JSON.stringify({ success: true, transaction }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Processar resposta da IA
    try {
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

      console.log('Transação processada:', transaction)

      return new Response(
        JSON.stringify({ success: true, transaction }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (parseError) {
      console.error('Erro ao processar resposta da IA:', parseError)
      console.error('Resposta original:', aiResponse)
      
      // Usar fallback em caso de erro
      const transaction = processWithFallback(text, categoryNames)
      
      return new Response(
        JSON.stringify({ success: true, transaction }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

// Função de fallback para processamento simples baseado em regras
function processWithFallback(text: string, categories: string[]): TransactionData {
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
  for (const cat of categories) {
    if (lowerText.includes(cat.toLowerCase())) {
      category = cat
      break
    }
  }
  
  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    amount,
    type,
    category,
    description: `Processado por voz: "${text}"`
  }
}