import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/supabase/actions'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, plan, target_exam')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-extrabold text-lg tracking-tight">
              Topnotch
            </span>
            <span className="text-amber-400 font-extrabold text-lg tracking-tight">
              Buddy
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden sm:block">
              {profile?.full_name ?? user.email}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full border font-medium
              border-amber-400 text-amber-400">
              {profile?.plan ?? 'free'}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-slate-400 hover:text-white text-sm transition"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}