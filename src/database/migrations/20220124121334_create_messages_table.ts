// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Knex from 'knex';


exports.up = (db: Knex): Promise<any> => Promise.all([
    db.schema.createTable('chat_channels', (table: Knex.CreateTableBuilder) => {
        table.integer('id').primary();              // explicitly not auto-incrementing due to queries
        table.string('hash').notNullable();
        table.string('hash_type').notNullable();

        table.unique(['hash', 'hash_type']);
    }),


    db.schema.createTable('chat_follows', (table: Knex.CreateTableBuilder) => {
        table.integer('chat_channel_id').unsigned().notNullable();
        table.integer('identity_id').unsigned().notNullable();

        table.foreign('chat_channel_id').references('id')
            .inTable('chat_channels');

        table.foreign('identity_id').references('id')
            .inTable('identities');

        table.unique(['chat_channel_id', 'identity_id']);

        table.timestamp('last_read').notNullable().defaultTo(0);
    }),


    db.schema.createTable('chat_participants', (table: Knex.CreateTableBuilder) => {
        table.integer('id').primary();              // explicitly not auto-incrementing due to queries

        table.string('sender').notNullable().unique();
        table.string('label');
    }),

    db.schema.createTable('chat_messages', (table: Knex.CreateTableBuilder) => {
        table.integer('id').primary();
        table.string('msgid').index();

        table.integer('chat_channel_id').unsigned().notNullable();
        table.foreign('chat_channel_id').references('id')
            .inTable('chat_channels').onDelete('cascade');

        table.integer('chat_participant_id').notNullable();
        table.foreign('chat_participant_id').references('id')
            .inTable('chat_participants');

        table.text('message').notNullable();

        table.timestamp('created_at').notNullable().defaultTo(db.fn.now());
    })
]);


exports.down = (db: Knex): Promise<any> => Promise.all([
    db.schema.dropTable('chat_channels'),
    db.schema.dropTable('chat_participants'),
    db.schema.dropTable('chat_messages')
]);
