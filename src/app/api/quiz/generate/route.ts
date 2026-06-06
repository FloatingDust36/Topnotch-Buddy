import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { examType, subject, difficulty, count = 10 } = await request.json()

    let query = supabase
      .from('questions')
      .select('id, question_text, choices, correct_answer, explanation, subject, topic, difficulty')
      .eq('exam_type', examType ?? 'LET')
      .eq('is_active', true)

    if (subject) query = query.eq('subject', subject)
    if (difficulty) query = query.eq('difficulty', difficulty)

    const { data: questions, error } = await query.limit(count * 3)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions found' }, { status: 404 })
    }

    // Shuffle and pick requested count
    const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, count)

    // Create quiz session
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: user.id,
        exam_type: examType ?? 'LET',
        subject: subject ?? null,
        mode: 'practice',
        total_questions: shuffled.length,
      })
      .select('id')
      .single()

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 })
    }

    // Strip correct_answer and explanation before sending to client
    const clientQuestions = shuffled.map(({ correct_answer, explanation, ...q }) => q)

    return NextResponse.json({
      sessionId: session.id,
      questions: clientQuestions,
      total: shuffled.length,
    })

  } catch (error) {
    console.error('Quiz generate error:', error)
    return NextResponse.json(
      { error: 'Failed to generate quiz' },
      { status: 500 }
    )
  }
}