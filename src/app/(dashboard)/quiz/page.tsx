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

type QuizState = 'setup' | 'loading' | 'active' | 'submitting' | 'results'

const EXAM_TYPES = ['LET', 'NLE', 'CPA', 'ECE', 'EE', 'DOST', 'CSE']

export default function QuizPage() {
  const router = useRouter()
  const [quizState, setQuizState] = useState<QuizState>('setup')
  const [examType, setExamType] = useState('LET')
  const [questions, setQuestions] = useState<Question[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({})
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [totalTime, setTotalTime] = useState(0)
  const [results, setResults] = useState<Result[]>([])
  const [score, setScore] = useState(0)
  const [reviewIndex, setReviewIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Timer
  useEffect(() => {
    if (quizState !== 'active') return
    const interval = setInterval(() => setTotalTime(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [quizState])

  // Reset question timer on navigation
  useEffect(() => {
    if (quizState === 'active') {
      setQuestionStartTime(Date.now())
    }
  }, [currentIndex, quizState])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  async function startQuiz() {
    setQuizState('loading')
    setError(null)
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examType, count: 10 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to start quiz')
      setQuestions(data.questions)
      setSessionId(data.sessionId)
      setCurrentIndex(0)
      setAnswers({})
      setTimeSpent({})
      setTotalTime(0)
      setQuizState('active')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setQuizState('setup')
    }
  }

  function selectAnswer(questionId: string, key: string) {
    if (answers[questionId]) return // already answered
    const spent = Math.round((Date.now() - questionStartTime) / 1000)
    setAnswers(prev => ({ ...prev, [questionId]: key }))
    setTimeSpent(prev => ({ ...prev, [questionId]: spent }))
  }

  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1)
    }
  }

  function prevQuestion() {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
    }
  }

  async function submitQuiz() {
    if (!sessionId) return
    setQuizState('submitting')
    try {
      const answersPayload = questions.map(q => ({
        questionId: q.id,
        selectedAnswer: answers[q.id] ?? '',
        timeSpent: timeSpent[q.id] ?? 0,
      }))
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answers: answersPayload,
          timeTaken: totalTime,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit')
      setResults(data.results)
      setScore(data.score)
      setQuizState('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
      setQuizState('active')
    }
  }

  const answeredCount = Object.keys(answers).length
  const currentQuestion = questions[currentIndex]
  const percentage = questions.length > 0
    ? Math.round((score / questions.length) * 100)
    : 0

  // ── SETUP SCREEN ──
  if (quizState === 'setup' || quizState === 'loading') {
    return (
      <div className="max-w-md mx-auto mt-16">
        <h1 className="text-white font-extrabold text-2xl mb-1">Practice Quiz</h1>
        <p className="text-slate-400 text-sm mb-8">10 questions · Instant AI explanations</p>

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

          {error && (
            <div className="bg-red-950 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            onClick={startQuiz}
            disabled={quizState === 'loading'}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold rounded-lg py-2.5 text-sm transition"
          >
            {quizState === 'loading' ? 'Preparing quiz...' : 'Start Quiz ⚡'}
          </button>
        </div>
      </div>
    )
  }

  // ── RESULTS SCREEN ──
  if (quizState === 'results') {
    const resultForCurrent = reviewIndex !== null
      ? results.find(r => r.questionId === questions[reviewIndex].id)
      : null

    return (
      <div className="max-w-2xl mx-auto">
        {reviewIndex === null ? (
          <>
            {/* Score card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center mb-6">
              <p className="text-slate-400 text-sm mb-2">Your score</p>
              <p className="text-6xl font-black text-white mb-1">
                {score}<span className="text-slate-500 text-3xl">/{questions.length}</span>
              </p>
              <p className={`text-2xl font-bold mt-2 ${
                percentage >= 75 ? 'text-amber-400' :
                percentage >= 50 ? 'text-indigo-400' : 'text-red-400'
              }`}>
                {percentage}%
              </p>
              <p className="text-slate-400 text-sm mt-3">
                {percentage >= 75
                  ? 'Excellent work! Keep it up 🔥'
                  : percentage >= 50
                  ? 'Good effort. Review your weak areas.'
                  : 'Keep studying — you\'ll get there!'}
              </p>
              <p className="text-slate-500 text-xs mt-2">
                Time: {formatTime(totalTime)}
              </p>
            </div>

            {/* Question review list */}
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
                onClick={() => setQuizState('setup')}
                className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg py-2.5 text-sm transition"
              >
                Take another quiz
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
          /* Individual question review */
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
                      {isCorrect && <span className="ml-auto text-green-400 text-xs font-bold">✓ Correct</span>}
                      {isSelected && !isCorrect && <span className="ml-auto text-red-400 text-xs font-bold">✗ Your answer</span>}
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

  // ── ACTIVE QUIZ ──
  if (!currentQuestion) return null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Quiz header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-slate-400 text-xs">
            {examType} · {currentQuestion.subject}
          </p>
          <p className="text-white font-bold text-sm">
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm font-mono">
            {formatTime(totalTime)}
          </span>
          <span className="text-slate-400 text-xs">
            {answeredCount}/{questions.length} answered
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-800 rounded-full h-1.5 mb-6">
        <div
          className="bg-amber-400 h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

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
            const answered = !!answers[currentQuestion.id]
            return (
              <button
                key={choice.key}
                onClick={() => selectAnswer(currentQuestion.id, choice.key)}
                disabled={answered}
                className={`w-full text-left rounded-xl px-4 py-3 text-sm border flex items-center gap-3 transition ${
                  selected
                    ? 'bg-indigo-900 border-indigo-500 text-white'
                    : answered
                    ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-750'
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
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg px-4 py-2.5 transition"
        >
          ← Previous
        </button>

        {/* Question dots */}
        <div className="flex gap-1.5">
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
            onClick={submitQuiz}
            disabled={quizState === 'submitting'}
            className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-sm font-bold rounded-lg px-4 py-2.5 transition"
          >
            {quizState === 'submitting' ? 'Submitting...' : 'Submit Quiz'}
          </button>
        ) : (
          <button
            onClick={nextQuestion}
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