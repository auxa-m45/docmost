import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create pg_bigm extension for Japanese text search
  await sql`CREATE EXTENSION IF NOT EXISTS pg_bigm`.execute(db);
  
  // Create GIN indexes on normalized title and text_content for pg_bigm
  await sql`
    CREATE INDEX IF NOT EXISTS pages_title_bigm_idx 
    ON pages USING gin (f_normalize_japanese(title) gin_bigm_ops)
  `.execute(db);
  
  await sql`
    CREATE INDEX IF NOT EXISTS pages_text_content_bigm_idx 
    ON pages USING gin (f_normalize_japanese(text_content) gin_bigm_ops)
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop the bigm indexes
  await sql`DROP INDEX IF EXISTS pages_text_content_bigm_idx`.execute(db);
  await sql`DROP INDEX IF EXISTS pages_title_bigm_idx`.execute(db);
  
  // Drop pg_bigm extension
  await sql`DROP EXTENSION IF EXISTS pg_bigm`.execute(db);
}
