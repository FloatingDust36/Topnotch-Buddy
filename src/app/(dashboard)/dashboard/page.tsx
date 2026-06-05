import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, plan, target_exam')
    .eq('id', user.id)
    .single()

  const { data: recentSessions } = await supabase
    .from('quiz_sessions')
    .select('id, exam_type, subject, mode, score, total_questions, completed_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: progress } = await supabase
    .from('user_progress')
    .select('subject, topic, accuracy_rate, total_attempts')
    .eq('user_id', user.id)
    .order('accuracy_rate', { ascending: true })
    .limit(3)

  const { data: streak } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak')
    .eq('user_id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const safeProgress = progress ?? []
  const safeSessions = recentSessions ?? []

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">
          Hey, {firstName} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Ready to review? Let&apos;s keep that streak going.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">
            Target Exam
          </p>
          <p className="text-white text-xl font-bold">
            {profile?.target_exam ?? 'LET'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">
            Current Streak
          </p>
          <p className="text-white text-xl font-bold">
            {streak?.current_streak ?? 0}
            <span className="text-amber-400 ml-1">🔥</span>
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">
            Longest Streak
          </p>
          <p className="text-white text-xl font-bold">
            {streak?.longest_streak ?? 0}
            <span className="text-slate-500 ml-1">days</span>
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">
            Plan
          </p>
          <p className="text-amber-400 text-xl font-bold capitalize">
            {profile?.plan ?? 'Free'}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-white font-bold text-base mb-3">
          Start reviewing
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="/quiz"
            className="bg-amber-400 hover:bg-amber-300 transition rounded-xl p-5 block group"
          >
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-slate-950 font-bold text-sm">Practice Quiz</p>
            <p className="text-slate-800 text-xs mt-0.5">
              Quick 10-question session
            </p>
          </a>

          <a
            href="/mock-exam"
            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition rounded-xl p-5 block"
          >
            <div className="text-2xl mb-2">📋</div>
            <p className="text-white font-bold text-sm">Mock Exam</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Full timed simulation
            </p>
          </a>

          <a
            href="/tutor"
            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition rounded-xl p-5 block"
          >
            <div className="text-2xl mb-2">🤖</div>
            <p className="text-white font-bold text-sm">AI Tutor</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Ask anything about your exam
            </p>
          </a>
        </div>
      </div>

      {/* Weak areas */}
      {safeProgress.length > 0 && (
        <div>
          <h2 className="text-white font-bold text-base mb-3">
            Needs attention
          </h2>
          <div className="space-y-2">
            {safeProgress.map((p) => {
              const accuracy = Number(p.accuracy_rate)
              const accuracyColor = accuracy < 50 ? 'text-red-400' : 'text-amber-400'
              return (
                <div
                  key={`${p.subject}-${p.topic}`}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {p.topic ?? p.subject}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {p.total_attempts} attempts
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${accuracyColor}`}>
                      {p.accuracy_rate}%
                    </p>
                    <p className="text-slate-500 text-xs">accuracy</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      {safeSessions.length > 0 && (
        <div>
          <h2 className="text-white font-bold text-base mb-3">
            Recent sessions
          </h2>
          <div className="space-y-2">
            {safeSessions.map((session) => {
              const pct = Math.round((session.score / session.total_questions) * 100)
              return (
                <div
                  key={session.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {session.subject ?? session.exam_type}
                    </p>
                    <p className="text-slate-400 text-xs capitalize">
                      {session.mode.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-bold">
                      {session.score}/{session.total_questions}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {pct}%
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {safeSessions.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-8 text-center">
          <p className="text-2xl mb-2">📚</p>
          <p className="text-white font-bold text-sm">No sessions yet</p>
          <p className="text-slate-400 text-xs mt-1">
            Start a practice quiz to see your progress here.
          </p>
        </div>
      )}

    </div>
  )
}