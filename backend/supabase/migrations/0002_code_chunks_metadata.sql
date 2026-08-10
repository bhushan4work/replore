-- 0002: code chunk metadata, analysis linkage, and duplicate protection.
--
-- Assumes the public.code_chunks table (and the match_code_chunks RPC)
-- already exist, as created via the Supabase dashboard. Adds the
-- columns used by the improved chunking/embedding pipeline.

alter table public.code_chunks
    add column if not exists analysis_id uuid
        references public.analysis_jobs (id) on delete set null;

alter table public.code_chunks
    add column if not exists symbol text;

alter table public.code_chunks
    add column if not exists symbol_type text;

alter table public.code_chunks
    add column if not exists start_line integer;

alter table public.code_chunks
    add column if not exists end_line integer;

-- Enables idempotent upserts and guarantees a repository never holds
-- two chunks for the same file/chunk_index.
create unique index if not exists code_chunks_repo_file_chunk_uidx
    on public.code_chunks (repository_id, file_path, chunk_index);

create index if not exists code_chunks_analysis_id_idx
    on public.code_chunks (analysis_id);
