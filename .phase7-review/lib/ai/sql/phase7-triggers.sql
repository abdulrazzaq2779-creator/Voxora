-- Phase 7: triggering the pipeline. For Member 2 to review. Run AFTER phase6-migration.sql.
--
-- 1. Every submitted response gets a 'queued' evaluation row, in the same database transaction as the
--    insert. This is what guarantees nothing is lost: even if every HTTP trigger fails, the sweeper
--    finds the queued row. It adds almost no time to the student's submission.
--    (If evaluations has other NOT NULL columns without defaults, add them to the insert.)
create or replace function enqueue_evaluation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into evaluations (response_id, ai_status)
  values (new.id, 'queued')
  on conflict (response_id) do nothing;
  return new;
end;
$$;

drop trigger if exists student_responses_enqueue on student_responses;
create trigger student_responses_enqueue
  after insert on student_responses
  for each row execute function enqueue_evaluation();

-- 2. Optional immediate trigger: a Database Webhook (Supabase dashboard > Database > Webhooks) on INSERT
--    into student_responses, POSTing to https://YOUR-APP/api/process with the HTTP header
--    x-pipeline-secret: <PIPELINE_SECRET>. The route reads record.id from the webhook payload.
--    The webhook is a speed-up only; the sweeper below is the guarantee.

-- 3. The sweeper: call the sweep route every minute with pg_cron + pg_net (works with any host).
--    Do NOT commit the real secret. Keep it in Supabase Vault or paste it only in the SQL editor.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'process-evaluations',
  '* * * * *',
  $$
    select net.http_post(
      url     := 'https://YOUR-APP-DOMAIN/api/cron/sweep',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-pipeline-secret', 'PASTE-PIPELINE-SECRET'),
      body    := '{}'::jsonb
    );
  $$
);
-- To stop it:  select cron.unschedule('process-evaluations');
