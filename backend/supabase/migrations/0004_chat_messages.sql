-- 0004: chat messages for multi-turn conversational sessions.
--
-- Stores per-session chat history so follow-up questions can
-- reference prior turns.  Each session is scoped to a single
-- repository via repository_id.

create table if not exists public.chat_messages (
    id            uuid primary key default gen_random_uuid(),
    repository_id uuid not null references public.repositories (id) on delete cascade,
    session_id    uuid not null,
    role          text not null check (role in ('user', 'assistant')),
    content       text not null,
    created_at    timestamptz not null default now()
);

create index if not exists chat_messages_session_idx
    on public.chat_messages (session_id, created_at);

create index if not exists chat_messages_repo_idx
    on public.chat_messages (repository_id);
