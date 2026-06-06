import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-extrabold tracking-tight">
            Topnotch<span className="text-amber-400"> Buddy</span>
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-slate-400 hover:text-white text-sm font-medium transition"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold px-4 py-2 rounded-lg transition"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative">
        {/* Background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-full px-4 py-1.5 text-xs font-medium text-slate-300 mb-8">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            AI-powered review for Filipino board exam takers
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6">
            Study smart.
            <br />
            <span className="text-amber-400">Pass first.</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Topnotch Buddy is your AI review companion for LET, NLE, CPA, Engineering,
            DOST, and more. Ask anything, practice smarter, and track every weak spot —
            until you&apos;re ready.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-base px-8 py-3.5 rounded-xl transition"
            >
              Start reviewing for free →
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-medium text-base px-8 py-3.5 rounded-xl transition"
            >
              I already have an account
            </Link>
          </div>

          <p className="text-slate-600 text-xs mt-5">
            No credit card required · Free to start · Built for Filipino professionals
          </p>
        </div>
      </section>

      {/* Exam types */}
      <section className="py-12 px-6 border-y border-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-slate-500 text-xs font-medium uppercase tracking-widest mb-6">
            Covering all major Philippine board exams
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: 'LET', sub: 'Teachers' },
              { label: 'NLE', sub: 'Nursing' },
              { label: 'CPA', sub: 'Accountancy' },
              { label: 'ECE', sub: 'Electronics' },
              { label: 'EE', sub: 'Electrical' },
              { label: 'DOST', sub: 'Scholarship' },
              { label: 'CSE', sub: 'Civil Service' },
            ].map(exam => (
              <div
                key={exam.label}
                className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-center"
              >
                <p className="text-white font-bold text-sm">{exam.label}</p>
                <p className="text-slate-500 text-xs">{exam.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Not just another reviewer app.
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Topnotch Buddy uses AI to understand where you struggle — and helps you fix it.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: '🤖',
                title: 'AI Tutor',
                desc: 'Ask anything about your exam — get clear, grounded explanations in seconds. No more searching through thick reviewers.',
                accent: 'border-indigo-700/50 hover:border-indigo-600/50',
              },
              {
                icon: '⚡',
                title: 'Smart Quiz Engine',
                desc: 'Practice with questions that adapt to your level. The system tracks what you get wrong and focuses your review where it counts.',
                accent: 'border-amber-700/50 hover:border-amber-600/50',
              },
              {
                icon: '📋',
                title: 'Mock Exam Simulator',
                desc: 'Timed, full-length simulations that mirror the real board exam experience. Build speed, stamina, and confidence.',
                accent: 'border-slate-700 hover:border-slate-600',
              },
              {
                icon: '📊',
                title: 'Progress Dashboard',
                desc: 'See exactly which topics you\'re weak on. Your dashboard updates after every session so you always know where to focus next.',
                accent: 'border-slate-700 hover:border-slate-600',
              },
              {
                icon: '🔥',
                title: 'Streak Tracking',
                desc: 'Build a daily review habit. Your streak keeps you accountable — because consistency is what actually gets you to pass.',
                accent: 'border-slate-700 hover:border-slate-600',
              },
              {
                icon: '🎯',
                title: 'RAG-Powered Accuracy',
                desc: 'Every AI answer is grounded in real reviewer content — not made up. No hallucinations. Just reliable, source-backed explanations.',
                accent: 'border-slate-700 hover:border-slate-600',
              },
            ].map(feature => (
              <div
                key={feature.title}
                className={`bg-slate-900 border rounded-2xl p-6 transition ${feature.accent}`}
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-white font-bold text-base mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 px-6 bg-slate-900/50 border-y border-slate-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { stat: '300K+', label: 'LET takers every year in the Philippines' },
              { stat: '~34%', label: 'Average passing rate — the pain is real' },
              { stat: '₱0', label: 'To start reviewing with Topnotch Buddy' },
            ].map(item => (
              <div key={item.stat}>
                <p className="text-4xl font-black text-amber-400 mb-2">{item.stat}</p>
                <p className="text-slate-400 text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Your board exam
            <br />
            <span className="text-amber-400">won&apos;t wait.</span>
          </h2>
          <p className="text-slate-400 mb-10">
            Start reviewing today. It&apos;s free, it&apos;s built for you, and your AI buddy is ready.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-lg px-10 py-4 rounded-xl transition"
          >
            Create your free account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-slate-500 text-sm font-bold">
            Topnotch<span className="text-amber-400"> Buddy</span>
          </span>
          <p className="text-slate-600 text-xs">
            Built for Filipino board exam takers. Study smart. Pass first.
          </p>
        </div>
      </footer>

    </div>
  )
}