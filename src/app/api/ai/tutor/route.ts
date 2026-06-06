import { createClient } from '@/lib/supabase/server'
import { geminiFlash } from '@/lib/gemini/client'
import { embedText } from '@/lib/gemini/embeddings'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, examType, history } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    // Step 1 — embed the user's question
    const queryEmbedding = await embedText(message)

    // Step 2 — retrieve relevant chunks from RAG
    const { data: chunks } = await supabase.rpc('match_document_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 5,
      filter_exam_type: examType ?? null,
    })

    // Step 3 — build context from retrieved chunks
    const context = chunks && chunks.length > 0
      ? chunks.map((c: { content: string; source_name: string }) =>
          `[Source: ${c.source_name}]\n${c.content}`
        ).join('\n\n')
      : null

    // Step 4 — build the prompt
    const systemContext = context
      ? `Use the following reviewer content to answer the question. Base your answer on this material:\n\n${context}\n\n---\n`
      : `No specific reviewer content was found for this question. Answer from your general knowledge about Philippine board exams.`

    // Step 5 — build chat history for multi-turn conversation
    const chatHistory = (history ?? []).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    // Step 6 — start chat and send message
    const chat = geminiFlash.startChat({
      history: chatHistory,
    })

    const promptWithContext = context
      ? `Use the following reviewer content to answer the question:\n\n${context}\n\n---\n\nQuestion: ${message}`
      : message

    const result = await chat.sendMessage(promptWithContext)
    const responseText = result.response.text()

    // Step 7 — save both messages to chat history
    await supabase.from('chat_messages').insert([
      {
        user_id: user.id,
        role: 'user',
        content: message,
        exam_context: examType ?? null,
      },
      {
        user_id: user.id,
        role: 'assistant',
        content: responseText,
        exam_context: examType ?? null,
      },
    ])

    return NextResponse.json({ response: responseText })

  } catch (error) {
    console.error('Tutor API error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}