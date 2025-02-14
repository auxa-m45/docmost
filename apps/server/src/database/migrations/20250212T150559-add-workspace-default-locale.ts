import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('workspaces')
        .addColumn('default_locale', 'varchar', (col) => col.defaultTo('en_US'))
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('workspaces')
        .dropColumn('default_locale')
        .execute()
}
