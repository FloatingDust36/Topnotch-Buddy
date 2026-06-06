'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

interface Choice {
  key: string
  text: string
}

interface Question {
  id: string
  question_text: string
  choices: Choice[]
  subject: string
  topic: string
  difficulty: string
}

interface Result {
  questionId: string
  selectedAnswer: string
  correctAnswer: string
  isCorrect: boolean
  explanation: string
}

type ExamState = 'setup' | 'loading' | 'active' | 'submitting' | 'results'

const EXAM_TYPES = ['LET', 'NLE', 'CPA', 'ECE', 'EE', 'DOST', 'CSE']
const EXAM_DURATIONS: Record<string, number> = {
  LET: 180,
  NLE: 180,
  CPA: 240,
  ECE: 180,
  EE: 180,
  DOST: 120,
  CSE: 120,
}
const EXAM_QUESTIONS: Record<string, number> = {
  LET: 10,
  NLE: 10,
  CPA: 10,
  ECE: 10,
  EE: 10,
  DOST: 10,
  CSE: 10,
}

export default function MockExamPage() {
  const router = useRouter()
  const [examState, setExamState] = useState<ExamState>('setup')
  const [examType, setExamType] = useState('LET')
  const [questions, setQuestions] = useState<Question[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [results, setResults] = useState<Result[]>([])
  const [score, setScore] = useState(0)
  const [reviewIndex, setReviewIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [autoSubmitted, setAutoSubmitted] = useState(false)

  const submitExam = useCallback(async (
    sid: string,
    qs: Question[],
    ans: Record<string, string>,
    timeTaken: number
  ) => {
    setExamState('submitting')
    try {
      const answersPayload = qs.map(q => ({
        questionId: q.id,
        selectedAnswer: ans[q.id] ?? '',
        timeSpent: 0,
      }))
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sid,
          answers: answersPayload,
          timeTaken,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit')
      setResults(data.results)
      setScore(data.score)
      setExamState('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
      setExamState('active')
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (examState !== 'active') return
    if (timeLeft <= 0) {
      setAutoSubmitted(true)
      submitExam(sessionId!, questions, answers, totalTime)
      return
    }
    const interval = setInterval(() => {
      setTimeLeft(t => t - 1)
      setTotalTime(t => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [examState, timeLeft, sessionId, questions, answers, totalTime, submitExam])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
  }

  async function startExam() {
    setExamState('loading')
    setError(null)
    try {
      const count = EXAM_QUESTIONS[examType] ?? 10
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examType, count }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to start exam')
      setQuestions(data.questions)
      setSessionId(data.sessionId)
      setCurrentIndex(0)
      setAnswers({})
      setTimeLeft((EXAM_DURATIONS[examType] ?? 120) * 60)
      setTotalTime(0)
      setAutoSubmitted(false)
      setExamState('active')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setExamState('setup')
    }
  }

  function selectAnswer(questionId: string, key: string) {
    setAnswers(prev => ({ ...prev, [questionId]: key }))
  }

  const answeredCount = Object.keys(answers).length
  const currentQuestion = questions[currentIndex]
  const percentage = questions.length > 0
    ? Math.round((score / questions.length) * 100)
    : 0
  const isLowTime = timeLeft > 0 && timeLeft <= 300 // 5 minutes warning

  // ── SETUP SCREEN ──
  if (examState === 'setup' || examState === 'loading') {
    return (
      <div className="max-w-md mx-auto mt-16">
        <h1 className="text-white font-extrabold text-2xl mb-1">Mock Exam</h1>
        <p className="text-slate-400 text-sm mb-8">
          Full timed simulation — just like the real thing
        </p>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Exam Type
            </label>
            <select
              value={examType}
              onChange={e => setExamType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {EXAM_TYPES.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Questions</span>
              <span className="text-white font-medium">
                {EXAM_QUESTIONS[examType] ?? 10}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Time limit</span>
              <span className="text-white font-medium">
                {EXAM_DURATIONS[examType] ?? 120} minutes
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Mode</span>
              <span className="text-amber-400 font-medium">Timed simulation</span>
            </div>
          </div>

          <div className="bg-amber-950 border border-amber-800 rounded-xl px-4 py-3 text-amber-300 text-xs">
            ⚠️ Once started, the timer cannot be paused. Answer all questions before time runs out.
          </div>

          {error && (
            <div className="bg-red-950 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            onClick={startExam}
            disabled={examState === 'loading'}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold rounded-lg py-2.5 text-sm transition"
          >
            {examState === 'loading' ? 'Preparing exam...' : 'Start Mock Exam 📋'}
          </button>
        </div>
      </div>
    )
  }

  // ── RESULTS SCREEN ──
  if (examState === 'results') {
    const resultForCurrent = reviewIndex !== null
      ? results.find(r => r.questionId === questions[reviewIndex].id)
      : null

    return (
      <div className="max-w-2xl mx-auto">
        {reviewIndex === null ? (
          <>
            {autoSubmitted && (
              <div className="bg-amber-950 border border-amber-800 text-amber-300 text-sm rounded-xl px-4 py-3 mb-4">
                ⏰ Time&apos;s up — your exam was automatically submitted.
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center mb-6">
              <p className="text-slate-400 text-sm mb-2">Mock Exam Score</p>
              <p className="text-6xl font-black text-white mb-1">
                {score}
                <span className="text-slate-500 text-3xl">/{questions.length}</span>
              </p>
              <p className={`text-2xl font-bold mt-2 ${
                percentage >= 75 ? 'text-amber-400' :
                percentage >= 50 ? 'text-indigo-400' : 'text-red-400'
              }`}>
                {percentage}%
              </p>
              <p className="text-slate-400 text-sm mt-3">
                {percentage >= 75
                  ? 'Outstanding! You\'re ready for the real thing. 🏆'
                  : percentage >= 50
                  ? 'Good progress. Focus on your weak areas.'
                  : 'Keep reviewing — consistency is key.'}
              </p>
              <p className="text-slate-500 text-xs mt-2">
                Time used: {formatTime(totalTime)}
              </p>
            </div>

            <h2 className="text-white font-bold text-base mb-3">Review answers</h2>
            <div className="space-y-2 mb-6">
              {questions.map((q, i) => {
                const result = results.find(r => r.questionId === q.id)
                return (
                  <button
                    key={q.id}
                    onClick={() => setReviewIndex(i)}
                    className="w-full text-left bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl px-4 py-3 flex items-center justify-between transition"
                  >
                    <span className="text-slate-300 text-sm">
                      {i + 1}. {q.question_text.slice(0, 60)}...
                    </span>
                    <span className={`text-xs font-bold ml-3 shrink-0 ${
                      result?.isCorrect ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {result?.isCorrect ? '✓ Correct' : '✗ Wrong'}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setExamState('setup')}
                className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg py-2.5 text-sm transition"
              >
                Take another exam
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg py-2.5 text-sm transition"
              >
                Back to dashboard
              </button>
            </div>
          </>
        ) : (
          <div>
            <button
              onClick={() => setReviewIndex(null)}
              className="text-slate-400 hover:text-white text-sm mb-4 flex items-center gap-1 transition"
            >
              ← Back to results
            </button>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-slate-400 text-xs mb-3">
                Question {reviewIndex + 1} · {questions[reviewIndex].subject}
              </p>
              <p className="text-white font-medium text-base mb-5">
                {questions[reviewIndex].question_text}
              </p>
              <div className="space-y-2 mb-5">
                {questions[reviewIndex].choices.map(choice => {
                  const isCorrect = choice.key === resultForCurrent?.correctAnswer
                  const isSelected = choice.key === resultForCurrent?.selectedAnswer
                  return (
                    <div
                      key={choice.key}
                      className={`rounded-xl px-4 py-3 text-sm border flex items-center gap-3 ${
                        isCorrect
                          ? 'bg-green-950 border-green-700 text-green-300'
                          : isSelected && !isCorrect
                          ? 'bg-red-950 border-red-700 text-red-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <span className="font-bold w-5 shrink-0">{choice.key}.</span>
                      <span>{choice.text}</span>
                      {isCorrect && (
                        <span className="ml-auto text-green-400 text-xs font-bold shrink-0">
                          ✓ Correct
                        </span>
                      )}
                      {isSelected && !isCorrect && (
                        <span className="ml-auto text-red-400 text-xs font-bold shrink-0">
                          ✗ Your answer
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              {resultForCurrent?.explanation && (
                <div className="bg-slate-800 rounded-xl p-4 text-sm text-slate-300 leading-relaxed">
                  <p className="text-amber-400 font-bold text-xs mb-2">💡 Explanation</p>
                  <ReactMarkdown>{resultForCurrent.explanation}</ReactMarkdown>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              {reviewIndex > 0 && (
                <button
                  onClick={() => setReviewIndex(reviewIndex - 1)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg py-2.5 transition"
                >
                  ← Previous
                </button>
              )}
              {reviewIndex < questions.length - 1 && (
                <button
                  onClick={() => setReviewIndex(reviewIndex + 1)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg py-2.5 transition"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── ACTIVE EXAM ──
  if (!currentQuestion) return null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Exam header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-slate-400 text-xs">{examType} Mock Exam</p>
          <p className="text-white font-bold text-sm">
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`font-mono font-bold text-lg px-3 py-1 rounded-lg ${
            isLowTime
              ? 'bg-red-950 text-red-400 border border-red-700 animate-pulse'
              : 'bg-slate-800 text-white'
          }`}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2">
        <div
          className="bg-amber-400 h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>
      <p className="text-slate-500 text-xs text-right mb-4">
        {answeredCount}/{questions.length} answered
      </p>

      {/* Question card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
            currentQuestion.difficulty === 'easy'
              ? 'text-green-400 border-green-700 bg-green-950'
              : currentQuestion.difficulty === 'hard'
              ? 'text-red-400 border-red-700 bg-red-950'
              : 'text-amber-400 border-amber-700 bg-amber-950'
          }`}>
            {currentQuestion.difficulty}
          </span>
          {currentQuestion.topic && (
            <span className="text-slate-500 text-xs">{currentQuestion.topic}</span>
          )}
        </div>

        <p className="text-white font-medium text-base leading-relaxed mb-6">
          {currentQuestion.question_text}
        </p>

        <div className="space-y-2">
          {currentQuestion.choices.map(choice => {
            const selected = answers[currentQuestion.id] === choice.key
            return (
              <button
                key={choice.key}
                onClick={() => selectAnswer(currentQuestion.id, choice.key)}
                className={`w-full text-left rounded-xl px-4 py-3 text-sm border flex items-center gap-3 transition ${
                  selected
                    ? 'bg-indigo-900 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-500'
                }`}
              >
                <span className={`font-bold w-5 shrink-0 ${
                  selected ? 'text-indigo-400' : 'text-slate-500'
                }`}>
                  {choice.key}.
                </span>
                <span>{choice.text}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg px-4 py-2.5 transition"
        >
          ← Previous
        </button>

        {/* Question dots */}
        <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition ${
                i === currentIndex
                  ? 'bg-amber-400'
                  : answers[q.id]
                  ? 'bg-indigo-500'
                  : 'bg-slate-600'
              }`}
            />
          ))}
        </div>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={() => submitExam(sessionId!, questions, answers, totalTime)}
            disabled={examState === 'submitting'}
            className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-sm font-bold rounded-lg px-4 py-2.5 transition"
          >
            {examState === 'submitting' ? 'Submitting...' : 'Submit Exam'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
            className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg px-4 py-2.5 transition"
          >
            Next →
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-red-950 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}
    </div>
  )
}