import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

/**
 * An in-memory Postgres that behaves like a Supabase project for our tests:
 * the anon / authenticated / service_role roles, an `auth.users` table and
 * `auth.uid()`. Our real migrations and seed run on top of it, so the RLS
 * policies under test are exactly the ones that ship.
 *
 * The storage migration is skipped (Supabase Storage isn't emulated here).
 */

const ROOT = path.resolve(__dirname, "../..");
const MIGRATIONS = path.join(ROOT, "supabase", "migrations");

const SUPABASE_STUB = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;

  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

  create schema auth;
  create table auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb not null default '{}'
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
`;

export type Role = "anon" | "authenticated" | "service_role";

export interface TestDb {
  db: PGlite;
  /** Run `fn` as a role (and optional user id), then switch back to the superuser. */
  as<T>(role: Role, userId: string | null, fn: (db: PGlite) => Promise<T>): Promise<T>;
  /** Create an auth user (which also creates their profile via trigger). */
  createUser(id: string, opts?: { admin?: boolean; name?: string }): Promise<void>;
}

export async function createTestDb(opts: { seed?: boolean } = { seed: true }): Promise<TestDb> {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);

  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql") && !f.includes("storage"))
    .sort();
  for (const f of files) {
    await db.exec(readFileSync(path.join(MIGRATIONS, f), "utf8"));
  }

  if (opts.seed) {
    await db.exec(readFileSync(path.join(ROOT, "supabase", "seed.sql"), "utf8"));
  }

  async function as<T>(role: Role, userId: string | null, fn: (d: PGlite) => Promise<T>) {
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? ""]);
    await db.exec(`set role ${role}`);
    try {
      return await fn(db);
    } finally {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
    }
  }

  async function createUser(id: string, o: { admin?: boolean; name?: string } = {}) {
    await db.query(
      "insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)",
      [id, `${id.slice(0, 8)}@example.com`, JSON.stringify({ full_name: o.name ?? "Test User" })],
    );
    if (o.admin) {
      await db.query("update public.profiles set role = 'admin' where id = $1", [id]);
    }
  }

  return { db, as, createUser };
}
