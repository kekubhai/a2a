#!/usr/bin/env node

/**
 * Direct invocation script for drizzle-kit commands.
 * Bypasses pnpm's runDepsStatusCheck which triggers esbuild postinstall failures on Windows.
 *
 * Usage:
 *   node db.mjs generate   — generate migration SQL
 *   node db.mjs push       — push schema directly to database
 *   node db.mjs migrate    — run pending migrations
 *   node db.mjs studio     — open Drizzle Studio
 *   node db.mjs seed       — run seed script
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PNPM_STORE = join(__dirname, 'node_modules', '.pnpm');

// Set ESBUILD_BINARY_PATH so drizzle-kit's bundled esbuild works
const esbuildVersions = ['0.28.1', '0.25.12', '0.18.20'];
for (const ver of esbuildVersions) {
  const exePath = join(
    PNPM_STORE,
    `@esbuild+win32-x64@${ver}`,
    'node_modules',
    '@esbuild',
    'win32-x64',
    'esbuild.exe',
  );
  if (existsSync(exePath)) {
    process.env.ESBUILD_BINARY_PATH = exePath;
    break;
  }
}

const command = process.argv[2];
if (!command) {
  console.error('Usage: node db.mjs <generate|push|migrate|studio|seed>');
  process.exit(1);
}

const DB_DIR = join(__dirname, 'packages', 'db');
process.chdir(DB_DIR);

try {
  if (command === 'seed') {
    const tsxPath = join(PNPM_STORE, 'tsx@4.23.0', 'node_modules', 'tsx', 'dist', 'cli.mjs');
    execFileSync('node', [tsxPath, 'src/seed.ts'], { stdio: 'inherit' });
  } else {
    const drizzleKitPath = join(PNPM_STORE, 'drizzle-kit@0.31.10', 'node_modules', 'drizzle-kit', 'bin.cjs');
    execFileSync('node', [drizzleKitPath, command], { stdio: 'inherit' });
  }
} catch (err) {
  process.exit(err.status || 1);
}
