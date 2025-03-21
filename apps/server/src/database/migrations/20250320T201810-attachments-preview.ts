import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createType('attachment_worker_status')
    .asEnum(['pending', 'converting', 'done', 'error'])
    .execute();
  await db.schema
    .alterTable('attachments')
    .addColumn('preview_url', 'text', (col) => col)
    .addColumn('worker_status', sql`attachment_worker_status`, (col) => col)
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('attachments')
    .dropColumn('preview_url')
    .dropColumn('worker_status')
    .execute();
  await db.schema.dropType('attachment_worker_status').execute();
}
