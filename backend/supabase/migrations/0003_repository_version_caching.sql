-- 0003: repository version caching.
--
-- Identifies each analysis by the repository plus its HEAD commit, so a
-- version that was already analyzed can be reused instead of reprocessed.

-- The commit/version a job analyzed.
alter table public.analysis_jobs
    add column if not exists commit_sha text;

create index if not exists analysis_jobs_repo_commit_idx
    on public.analysis_jobs (github_url, commit_sha);

-- The version currently analyzed for a repository.
alter table public.repositories
    add column if not exists commit_sha text;
