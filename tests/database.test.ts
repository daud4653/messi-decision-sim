import { beforeAll, afterAll, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    "create role anon; create role authenticated; create role service_role;",
  );
  await db.exec(await readFile("supabase/migrations/001_initial.sql", "utf8"));
}, 20000);
afterAll(async () => {
  await db.close();
});
it("locks the first choice and rejects later replacements", async () => {
  const id = "11111111-1111-4111-8111-111111111111";
  await db.query("insert into round_sessions(id,scenario_id) values($1,$2)", [
    id,
    "fixture-1",
  ]);
  await db.query("select * from lock_round($1,$2,$3)", [
    id,
    "PASS",
    "FINAL LEFT",
  ]);
  const { rows } = await db.query<{
    selected_action: string;
    selected_target_zone: string;
  }>("select * from lock_round($1,$2,$3)", [id, "SHOT", "FINAL CENTRE"]);
  expect(rows[0].selected_action).toBe("PASS");
  expect(rows[0].selected_target_zone).toBe("FINAL LEFT");
});
it("does not return expired rounds", async () => {
  await db.exec(
    "insert into round_sessions(id,scenario_id,expires_at) values ('22222222-2222-4222-8222-222222222222','fixture-2',now()-interval '1 second')",
  );
  const { rows } = await db.query(
    "select * from lock_round('22222222-2222-4222-8222-222222222222','SHOT',null)",
  );
  expect(rows).toHaveLength(0);
});
it("blocks anonymous access to hidden answers and mutation functions", async () => {
  const { rows } = await db.query<{ allowed: boolean }>(
    "select has_table_privilege('anon','public.scenarios','select') as allowed",
  );
  expect(rows[0].allowed).toBe(false);
  const fn = await db.query<{ allowed: boolean }>(
    "select has_function_privilege('anon','public.lock_round(uuid,text,text)','execute') as allowed",
  );
  expect(fn.rows[0].allowed).toBe(false);
  const tables = await db.query<{ relrowsecurity: boolean }>(
    "select relrowsecurity from pg_class where relname in ('scenarios','events','agent_runs','round_sessions')",
  );
  expect(tables.rows.every((t) => t.relrowsecurity)).toBe(true);
});
it("uniquely claims a cached agent run across callers", async () => {
  await db.exec(
    "insert into matches(id,source,source_id,match_date,season) values ('33333333-3333-4333-8333-333333333333','statsbomb','1','2022-12-18','2022'); insert into players(id,source,source_id,name) values ('44444444-4444-4444-8444-444444444444','statsbomb','5503','Messi'); insert into events(id,source_event_id,match_id,event_type,raw_event) values ('55555555-5555-4555-8555-555555555555','event','33333333-3333-4333-8333-333333333333','Pass','{}'); insert into scenarios(id,match_id,event_id,player_id,season,era,scenario_context,actual_action) values ('66666666-6666-4666-8666-666666666666','33333333-3333-4333-8333-333333333333','55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444','2022','ARGENTINA','{}','PASS')",
  );
  const sql =
    "select claim_agent_run('66666666-6666-4666-8666-666666666666','gemini','model','v1') as claimed";
  const first = await db.query<{ claimed: boolean }>(sql),
    second = await db.query<{ claimed: boolean }>(sql);
  expect(first.rows[0].claimed).toBe(true);
  expect(second.rows[0].claimed).toBe(false);
});
