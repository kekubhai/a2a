import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  throw new Error('DATABASE_URL environment variable is required');
}

// Create a connection with enhanced error handling
let sql: ReturnType<typeof neon>;
try {
  sql = neon(DATABASE_URL);
} catch (error) {
  console.error('Failed to create Neon connection:', error);
  throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

export const db = drizzle(sql, { schema });

export type Database = typeof db;
