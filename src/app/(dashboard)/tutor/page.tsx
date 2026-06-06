'use client'

import { useState, useEffect, useRef } from 'react'
import ChatMessage from '@/components/tutor/ChatMessage'
import ChatInput from '@/components/tutor/ChatInput'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const EXAM_TYPES = ['LET', 'NLE', 'CPA', 'ECE', 'EE', 'DOST', 'CSE']

const STARTER_QUESTIONS = [
  "What is Bloom's Taxonomy and how does it apply to LET?",
  "Explain the difference between classical and operant conditioning.",
  "What are the key principles of child development I should know?",
  "How do I approach multiple choice questions strategically?",
]

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [examType, setExamType] = useState('LET')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(content: string) {
    const userMessage: Message = { role: 'user', content }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          examType,
          history: messages,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Something went wrong')
      }

      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: data.response },
      ])
    } catch (err) {
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-4rem)]">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-white font-extrabold text-xl">AI Tutor</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Ask anything about your board exam
          </p>
        </div>

        {/* Exam selector */}
        <select
          value={examType}
          onChange={(e) => setExamType(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {EXAM_TYPES.map((exam) => (
            <option key={exam} value={exam}>{exam}</option>
          ))}
        </select>
      </div>

      {/* Chat window */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center mx-auto mb-3">
                <span className="text-slate-950 text-2xl font-black">TB</span>
              </div>
              <p className="text-white font-bold">
                Hey! I&apos;m your Topnotch Buddy.
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Ask me anything about {examType} — I&apos;m here to help you pass.
              </p>
            </div>

            {/* Starter questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl px-4 py-3 text-slate-300 text-xs transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
              <span className="text-slate-950 text-xs font-bold">TB</span>
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={loading} />
    </div>
  )
}