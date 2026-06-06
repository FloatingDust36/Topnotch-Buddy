import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface Answer {
  questionId: string
  selectedAnswer: string
  timeSpent?: number
}

interface GradedAnswer {
  session_id: string
  user_id: string
  question_id: string
  selected_answer: string
  is_correct: boolean
  time_spent_seconds: number | null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, answers, timeTaken } = await request.json()

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('id, exam_type, total_questions, user_id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Fetch correct answers for submitted question IDs
    const questionIds = answers.map((a: Answer) => a.questionId)
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, correct_answer, explanation, subject, topic')
      .in('id', questionIds)

    if (questionsError || !questions) {
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    // Grade answers
    const questionMap = new Map(questions.map(q => [q.id, q]))
    let score = 0
    const gradedAnswers: GradedAnswer[] = answers.map((a: Answer) => {
      const question = questionMap.get(a.questionId)
      const isCorrect = question?.correct_answer === a.selectedAnswer
      if (isCorrect) score++
      return {
        session_id: sessionId,
        user_id: user.id,
        question_id: a.questionId,
        selected_answer: a.selectedAnswer,
        is_correct: isCorrect,
        time_spent_seconds: a.timeSpent ?? null,
      }
    })

    // Save answers
    await supabase.from('quiz_answers').insert(gradedAnswers)

    // Update session
    await supabase
      .from('quiz_sessions')
      .update({
        score,
        time_taken_seconds: timeTaken ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    // Update user progress per topic
    for (const question of questions) {
      const answer = gradedAnswers.find(a => a.question_id === question.id)
      if (!answer) continue

      const { data: existing } = await supabase
        .from('user_progress')
        .select('id, total_attempts, correct_attempts')
        .eq('user_id', user.id)
        .eq('exam_type', session.exam_type)
        .eq('subject', question.subject)
        .eq('topic', question.topic ?? '')
        .single()

      if (existing) {
        const newTotal = existing.total_attempts + 1
        const newCorrect = existing.correct_attempts + (answer.is_correct ? 1 : 0)
        await supabase
          .from('user_progress')
          .update({
            total_attempts: newTotal,
            correct_attempts: newCorrect,
            accuracy_rate: Number(((newCorrect / newTotal) * 100).toFixed(2)),
            last_attempted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            exam_type: session.exam_type,
            subject: question.subject,
            topic: question.topic ?? '',
            total_attempts: 1,
            correct_attempts: answer.is_correct ? 1 : 0,
            accuracy_rate: answer.is_correct ? 100.00 : 0.00,
            last_attempted_at: new Date().toISOString(),
          })
      }
    }

    // Update streak
    const today = new Date().toISOString().split('T')[0]
    const { data: streak } = await supabase
      .from('streaks')
      .select('id, current_streak, longest_streak, last_activity_date')
      .eq('user_id', user.id)
      .single()

    if (streak) {
      const lastDate = streak.last_activity_date
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      const newStreak = lastDate === yesterdayStr
        ? streak.current_streak + 1
        : lastDate === today
          ? streak.current_streak
          : 1

      await supabase
        .from('streaks')
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streak.longest_streak),
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', streak.id)
    } else {
      await supabase
        .from('streaks')
        .insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
        })
    }

    // Return results with explanations
    const results = answers.map((a: Answer) => {
      const question = questionMap.get(a.questionId)
      return {
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
        correctAnswer: question?.correct_answer,
        isCorrect: question?.correct_answer === a.selectedAnswer,
        explanation: question?.explanation,
      }
    })

    return NextResponse.json({
      score,
      total: session.total_questions,
      percentage: Math.round((score / session.total_questions) * 100),
      results,
    })

  } catch (error) {
    console.error('Quiz submit error:', error)
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    )
  }
}