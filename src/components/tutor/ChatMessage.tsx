import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-slate-950 text-xs font-bold">TB</span>
        </div>
      )}

      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : 'bg-slate-800 text-slate-100 rounded-tl-sm'
        )}
      >
        {isUser ? (
          content
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p className="mb-2 last:mb-0">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-amber-400">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-slate-300">{children}</em>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-slate-200">{children}</li>
              ),
              code: ({ children }) => (
                <code className="bg-slate-700 text-amber-300 px-1 py-0.5 rounded text-xs">
                  {children}
                </code>
              ),
              h1: ({ children }) => (
                <h1 className="text-white font-bold text-base mb-2">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-white font-bold text-sm mb-2">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-white font-semibold text-sm mb-1">{children}</h3>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-slate-300 text-xs font-bold">You</span>
        </div>
      )}
    </div>
  )
}