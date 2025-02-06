import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {

    await db.schema
        .alterTable('workspaces')
        .addColumn('discord_enabled', 'boolean', (col) => col.notNull().defaultTo(false))
        .addColumn('discord_client_id', 'text')
        .addColumn('discord_client_secret', 'text')
        .addColumn('discord_guild_id', 'text')
        .addColumn('discord_jit_enabled', 'boolean', (col) => col.notNull().defaultTo(false))
        .execute();

    await db.schema
        .alterTable('users')
        .addColumn('discord_id', 'text')
        .execute();

    await db.schema
        .createIndex('users_discord_id_idx')
        .on('users')
        .column('discord_id')
        .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('workspaces')
        .dropColumn('discord_enabled')
        .dropColumn('discord_client_id')
        .dropColumn('discord_client_secret')
        .dropColumn('discord_guild_id')
        .dropColumn('discord_jit_enabled')
        .execute();

    await db.schema
        .alterTable('users')
        .dropColumn('discord_id')
        .execute();

    await db.schema
        .dropIndex('users_discord_id_idx')
        .on('users')
        .execute();
}
