-- Run in Supabase SQL Editor or `supabase db push`. Server-only access, no anonymous policies.
-- gen_random_uuid() is built into PostgreSQL 13+.
create table public.competitions (
 id uuid primary key default gen_random_uuid(), source text not null, source_id text not null,
 name text not null, season_name text not null, metadata jsonb not null default '{}', created_at timestamptz not null default now(), unique(source,source_id,season_name)
);
create table public.teams (id uuid primary key default gen_random_uuid(),source text not null,source_id text not null,name text not null,country text,metadata jsonb not null default '{}',created_at timestamptz not null default now(),unique(source,source_id));
create table public.players (id uuid primary key default gen_random_uuid(),source text not null,source_id text not null,name text not null,nickname text,metadata jsonb not null default '{}',created_at timestamptz not null default now(),unique(source,source_id));
create table public.matches (
 id uuid primary key default gen_random_uuid(),source text not null,source_id text not null,competition_id uuid references public.competitions(id),home_team_id uuid references public.teams(id),away_team_id uuid references public.teams(id),match_date date not null,season text not null,home_score integer,away_score integer,metadata jsonb not null default '{}',created_at timestamptz not null default now(),unique(source,source_id)
);
create table public.events (
 id uuid primary key default gen_random_uuid(),source_event_id text not null unique,match_id uuid not null references public.matches(id),player_id uuid references public.players(id),team_id uuid references public.teams(id),possession integer,minute integer,second integer,period integer,event_type text not null,event_subtype text,location_x double precision,location_y double precision,end_location_x double precision,end_location_y double precision,outcome text,raw_event jsonb not null,created_at timestamptz not null default now()
);
create index events_match on public.events(match_id);
create table public.player_match_stats (
 id uuid primary key default gen_random_uuid(),player_id uuid not null references public.players(id),match_id uuid references public.matches(id),season text not null,source text not null,source_url text,minutes double precision,goals integer,assists integer,shots integer,shots_on_target integer,key_passes integer,through_balls integer,successful_dribbles integer,xg double precision,xa double precision,rating double precision,metadata jsonb not null default '{}',created_at timestamptz not null default now()
);
create table public.player_season_profiles (
 id uuid primary key default gen_random_uuid(),player_id uuid not null references public.players(id),season text not null,team_id uuid references public.teams(id),source text not null,appearances integer,minutes double precision,goals integer,assists integer,shots integer,key_passes integer,successful_dribbles integer,through_balls integer,xg double precision,xa double precision,metadata jsonb not null default '{}',created_at timestamptz not null default now()
);
create index profiles_season on public.player_season_profiles(season);
create table public.scenarios (
 id uuid primary key default gen_random_uuid(),match_id uuid not null references public.matches(id),event_id uuid not null references public.events(id),player_id uuid not null references public.players(id),season text not null,era text not null,minute integer,second integer,period integer,score_state text,location_x double precision,location_y double precision,pitch_zone text,horizontal_zone text,vertical_zone text,distance_to_goal double precision,angle_to_goal double precision,previous_event_type text,previous_player_name text,possession_event_count integer,recent_events jsonb not null default '[]',scenario_context jsonb not null,
 actual_action text not null check(actual_action in ('PASS','CARRY','DRIBBLE','SHOT','CROSS','RECYCLE')),actual_target_zone text,actual_target_x double precision,actual_target_y double precision,actual_outcome text,difficulty text,created_at timestamptz not null default now(),unique(event_id)
);
create index scenario_similarity on public.scenarios(era,pitch_zone,score_state,distance_to_goal);
create table public.agent_runs (
 id uuid primary key default gen_random_uuid(),scenario_id uuid not null references public.scenarios(id),provider text not null,model text not null,prompt_version text not null,predicted_action text,predicted_target_zone text,predicted_intent text,confidence double precision check(confidence between 0 and 1),historical_tendencies jsonb,raw_response jsonb,created_at timestamptz not null default now(),unique(scenario_id,provider,model,prompt_version)
);
create table public.round_sessions (
 id uuid primary key default gen_random_uuid(),scenario_id text not null,selected_action text check(selected_action in ('PASS','CARRY','DRIBBLE','SHOT','CROSS','RECYCLE')),selected_target_zone text,result jsonb,expires_at timestamptz not null default now()+interval '1 hour',created_at timestamptz not null default now()
);
create index rounds_expiry on public.round_sessions(expires_at);
create table public.user_attempts (
 id uuid primary key default gen_random_uuid(),round_id uuid unique references public.round_sessions(id),scenario_id uuid not null references public.scenarios(id),selected_action text not null,selected_target_zone text,exact_match boolean,action_similarity double precision,target_similarity double precision,overall_similarity double precision,created_at timestamptz not null default now()
);
-- RLS with no client policies is intentional: even the anon key cannot read answers.
do $$ declare t text; begin foreach t in array array['competitions','teams','players','matches','events','player_match_stats','player_season_profiles','scenarios','agent_runs','round_sessions','user_attempts'] loop execute format('alter table public.%I enable row level security',t); execute format('revoke all on public.%I from anon, authenticated',t); execute format('grant all on public.%I to service_role',t); end loop; end $$;
-- Atomic first-choice lock. A random round UUID is a capability, not a user identifier.
create function public.lock_round(p_id uuid,p_action text,p_target text) returns setof public.round_sessions language plpgsql security invoker set search_path=public as $$
begin
 update public.round_sessions set selected_action=p_action,selected_target_zone=p_target where id=p_id and selected_action is null and expires_at>now();
 return query select * from public.round_sessions where id=p_id and expires_at>now();
end $$;
revoke all on function public.lock_round(uuid,text,text) from public,anon,authenticated;
grant execute on function public.lock_round(uuid,text,text) to service_role;
-- Claim a provider call across serverless instances. A crashed claim expires after a minute.
create function public.claim_agent_run(p_scenario uuid,p_provider text,p_model text,p_version text) returns boolean language plpgsql security invoker set search_path=public as $$
declare claimed uuid;
begin
 delete from public.agent_runs where scenario_id=p_scenario and provider=p_provider and model=p_model and prompt_version=p_version and raw_response is null and created_at<now()-interval '1 minute';
 insert into public.agent_runs(scenario_id,provider,model,prompt_version) values(p_scenario,p_provider,p_model,p_version) on conflict do nothing returning id into claimed;
 return claimed is not null;
end $$;
revoke all on function public.claim_agent_run(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.claim_agent_run(uuid,text,text,text) to service_role;
-- Run periodically from an operator session; no worker infrastructure required:
-- delete from public.round_sessions where expires_at < now()-interval '7 days' and id not in (select round_id from public.user_attempts);
