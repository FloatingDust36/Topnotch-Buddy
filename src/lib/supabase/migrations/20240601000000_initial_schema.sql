-- Enable pgvector extension
-- Note: enable via Supabase Dashboard > Database > Extensions > vector

-- =====================
-- PROFILES
-- =====================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'premium')),
  target_exam text default 'LET' check (target_exam in ('LET', 'NLE', 'CPA', 'ECE', 'EE', 'DOST', 'CSE')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- =====================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =====================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security invoker
set search_path = 'public'
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================
-- QUESTIONS BANK
-- =====================
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_type text not null check (exam_type in ('LET', 'NLE', 'CPA', 'ECE', 'EE', 'DOST', 'CSE')),
  subject text not null,
  topic text,
  difficulty text default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  question_text text not null,
  choices jsonb not null,
  correct_answer text not null,
  explanation text,
  source text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.questions enable row level security;

create policy "Authenticated users can read active questions"
  on public.questions for select
  to authenticated
  using (is_active = true);

-- =====================
-- QUIZ SESSIONS
-- =====================
create table public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  exam_type text not null,
  subject text,
  mode text default 'practice' check (mode in ('practice', 'mock_exam', 'weak_areas')),
  total_questions int not null,
  score int default 0,
  time_taken_seconds int,
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.quiz_sessions enable row level security;

create policy "Users can manage own quiz sessions"
  on public.quiz_sessions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================
-- QUIZ ANSWERS
-- =====================
create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.quiz_sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  question_id uuid references public.questions(id) not null,
  selected_answer text not null,
  is_correct boolean not null,
  time_spent_seconds int,
  created_at timestamptz default now()
);

alter table public.quiz_answers enable row level security;

create policy "Users can manage own quiz answers"
  on public.quiz_answers for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================
-- USER PROGRESS
-- =====================
create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  exam_type text not null,
  subject text not null,
  topic text,
  total_attempts int default 0,
  correct_attempts int default 0,
  accuracy_rate numeric(5,2) default 0.00,
  last_attempted_at timestamptz,
  updated_at timestamptz default now(),
  unique(user_id, exam_type, subject, topic)
);

alter table public.user_progress enable row level security;

create policy "Users can manage own progress"
  on public.user_progress for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================
-- STREAKS
-- =====================
create table public.streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  current_streak int default 0,
  longest_streak int default 0,
  last_activity_date date,
  updated_at timestamptz default now()
);

alter table public.streaks enable row level security;

create policy "Users can manage own streaks"
  on public.streaks for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================
-- CHAT MESSAGES
-- =====================
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  exam_context text,
  created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;

create policy "Users can manage own chat messages"
  on public.chat_messages for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================
-- DOCUMENT CHUNKS (RAG)
-- =====================
create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  exam_type text not null,
  source_name text not null,
  subject text,
  content text not null,
  embedding extensions.vector(768),
  chunk_index int,
  created_at timestamptz default now()
);

alter table public.document_chunks enable row level security;

create policy "Authenticated users can read document chunks"
  on public.document_chunks for select
  to authenticated
  using (true);

create index on public.document_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

-- =====================
-- RAG SIMILARITY SEARCH FUNCTION
-- =====================
create or replace function public.match_document_chunks(
  query_embedding extensions.vector(768),
  match_threshold float default 0.7,
  match_count int default 5,
  filter_exam_type text default null
)
returns table (
  id uuid,
  content text,
  source_name text,
  subject text,
  similarity float
)
language sql
stable
security invoker
set search_path = extensions, public, pg_temp
as $$
  select
    dc.id,
    dc.content,
    dc.source_name,
    dc.subject,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where
    (filter_exam_type is null or dc.exam_type = filter_exam_type)
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

revoke execute on function public.match_document_chunks from anon;
revoke execute on function public.match_document_chunks from public;
grant execute on function public.match_document_chunks to authenticated;