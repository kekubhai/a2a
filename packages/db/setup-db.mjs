// One-shot DB setup: applies the schema migration, then seeds demo data.
// Usage (from packages/db):  node setup-db.mjs
// Reads DATABASE_URL from the repo root .env (../../.env).
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import { execSync } from 'child_process';

function loadDatabaseUrl() {
  // Prefer an already-exported env var, then fall back to the root .env file.
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL.trim();
  const line = fs
    .readFileSync('../../.env', 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith('DATABASE_URL='));
  if (!line) throw new Error('DATABASE_URL not found in ../../.env');
  return line
    .replace(/^DATABASE_URL=/, '')
    .replace(/^"|"$/g, '')
    .trim();
}

const url = loadDatabaseUrl();
const sql = neon(url);

async function verifyAuth() {
  try {
    await sql`SELECT 1`;
    console.log('✓ Database auth OK');
  } catch (e) {
    console.error('✗ Database auth FAILED:', e.message);
    console.error(
      '\nYour DATABASE_URL password is being rejected. Get a fresh connection string\n' +
        'from the Neon dashboard (Connection Details → pooled string), update the root .env,\n' +
        'then re-run:  cd packages/db && node setup-db.mjs\n',
    );
    process.exit(1);
  }
}

async function migrate() {
  const raw = fs.readFileSync('drizzle/0000_kind_nekra.sql', 'utf8');
  const statements = raw
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean);
  console.log(`\nApplying migration (${statements.length} statements)...`);
  let ok = 0;
  for (const stmt of statements) {
    try {
      // neon() v0.10.x sql is a tagged-template fn; to run a dynamic raw DDL string
      // we pass a single-element "template strings" array (no interpolations).
      const tsa = Object.assign([stmt], { raw: [stmt] });
      await sql(tsa);
      ok++;
    } catch (e) {
      if (/already exists/i.test(e.message)) {
        ok++; // idempotent: fine if the object already exists
      } else {
        console.error('FAILED statement:', stmt.slice(0, 80).replace(/\n/g, ' '));
        throw e;
      }
    }
  }
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
  `;
  console.log(`✓ Migration done (${ok}/${statements.length}). Tables: ${tables.map((t) => t.table_name).join(', ')}`);
}

async function seed() {
  console.log('\nSeeding demo data...');
  // Reuse the existing seed script so data stays in sync with one source of truth.
  execSync('node ../../node_modules/.pnpm/tsx@4.23.0/node_modules/tsx/dist/cli.mjs src/seed.ts', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}

await verifyAuth();
await migrate();
await seed();
console.log('\n✅ Database is ready. Restart the dev server if it was already running.');
