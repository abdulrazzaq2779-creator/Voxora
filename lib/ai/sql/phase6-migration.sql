-- Phase 6: failure handling and retries.  For Member 2 to review and run in the Supabase SQL editor.
-- Keeps the existing column name ai_status (no rename), so nothing else breaks.
--
-- RUN PART 1 FIRST, ON ITS OWN, then Parts 2 and 3. (New enum values cannot be used in the same
-- transaction that adds them.)

-- ===== PART 1: extra status values =====
alter type ai_status add value if not exists 'queued';
alter type ai_status add value if not exists 'transcribing';
alter type ai_status add value if not exists 'transcribed';
alter type ai_status add value if not exists 'scoring';
alter type ai_status add value if not exists 'needs_manual_review';
alter type ai_status add value if not exists 'failed_retryable';
-- 'completed' and 'failed' already exist.

-- ===== PART 2: tracking columns =====
alter table evaluations
  add column if not exists retry_count int not null default 0,
  add column if not exists last_error text,
  add column if not exists last_error_code text,
  add column if not exists next_retry_at timestamptz,
  add column if not exists status_changed_at timestamptz not null default now();

-- One evaluation per response (needed for idempotent upserts). Skip if it is already unique.
-- alter table evaluations add constraint evaluations_response_id_key unique (response_id);

-- The sweeper looks for rows that are due; keep that query cheap.
create index if not exists evaluations_due_idx on evaluations (ai_status, next_retry_at);

-- Make sure every submitted response has a row, so processing can find it. Run once for existing rows:
-- insert into evaluations (response_id, ai_status)
--   select id, 'queued' from student_responses
--   on conflict (response_id) do nothing;
-- ...and for new submissions, insert the 'queued' row in the submit handler (or with a trigger on student_responses).

-- ===== PART 3: atomic claim =====
-- Moves one response into transcribing (or scoring, if a transcript is already saved) ONLY if its
-- status allows it. Because it is a single UPDATE, two runners can never both claim the same row.
--   automatic: queued, transcribed, failed_retryable once next_retry_at has passed, or a stuck
--              transcribing/scoring older than p_stale_seconds
--   admin:     anything that is not actively running; also resets retry_count to 0
create or replace function claim_evaluation(
  p_response_id uuid,
  p_admin boolean default false,
  p_retranscribe boolean default false,
  p_stale_seconds int default 600
)
returns table (out_transcript text, out_retry_count int)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update evaluations e
     set ai_status = (case
                        when not p_retranscribe and coalesce(btrim(e.transcript), '') <> '' then 'scoring'
                        else 'transcribing'
                      end)::ai_status,
         retry_count = case when p_admin then 0 else e.retry_count end,
         last_error = null,
         last_error_code = null,
         next_retry_at = null,
         status_changed_at = now()
   where e.response_id = p_response_id
     and (
          (
  p_admin
  and e.ai_status::text in (
    'queued',
    'transcribed',
    'failed_retryable',
    'failed',
    'needs_manual_review'
  )
)
       or e.ai_status::text in ('queued', 'transcribed')
       or (
  e.ai_status::text = 'failed_retryable'
  and e.retry_count < 3
  and coalesce(e.next_retry_at, now()) <= now()
)
       or (e.ai_status::text in ('transcribing', 'scoring')
           and e.status_changed_at < now() - make_interval(secs => p_stale_seconds))
     )
  returning e.transcript, e.retry_count;
end;
$$;

-- Only the server (service role) may call it. Students and the browser must never be able to.
revoke all on function claim_evaluation(uuid, boolean, boolean, int) from public, anon, authenticated;
grant execute on function claim_evaluation(uuid, boolean, boolean, int) to service_role;

-- Sweeper query (run it from a cron job or Edge Function every minute, then call runPipeline for each id):
--   select response_id from evaluations
--    where ai_status::text in ('queued', 'transcribed')
--       or (ai_status::text = 'failed_retryable' and next_retry_at <= now() and retry_count < 3)
--       or (ai_status::text in ('transcribing', 'scoring') and status_changed_at < now() - interval '10 minutes')
--    order by status_changed_at limit 20;
