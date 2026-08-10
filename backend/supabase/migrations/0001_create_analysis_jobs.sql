-- 0001: analysis jobs for asynchronous repository analysis.

create table if not exists public.analysis_jobs (
    id uuid primary key default gen_random_uuid(),
    github_url text not null,
    status text not null default 'queued',
    current_stage text,
    progress text,
    repository_id uuid references public.repositories (id) on delete set null,
    error_message text,
    created_at timestamptz not null default now(),
    started_at timestamptz,
    updated_at timestamptz,
    completed_at timestamptz,
    failed_at timestamptz
);

create index if not exists analysis_jobs_status_idx
    on public.analysis_jobs (status);

create index if not exists analysis_jobs_repository_id_idx
    on public.analysis_jobs (repository_id);
