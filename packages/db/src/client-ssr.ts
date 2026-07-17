import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../schema';

let cachedDb: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    throw new Error('DATABASE_URL environment variable is required');
  }

  try {
    const sql = neon(DATABASE_URL);
    cachedDb = drizzle(sql, { schema });
    return cachedDb;
  } catch (error) {
    console.error('Failed to create Neon connection:', error);
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const db = getDb();

export type Database = typeof db;