// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Knex from 'knex';

exports.up = (db: Knex): Promise<any> => {
    return Promise.all([
        db.schema.createTable('listing_items', (table: Knex.CreateTableBuilder) => {

            table.increments('id').primary();

            table.string('msgid').notNullable().unique();
            table.string('hash').notNullable();   // .notNullable().unique();

            table.string('seller').notNullable();
            table.string('signature').notNullable();
            table.string('market').notNullable();

            table.integer('listing_item_template_id').unsigned().nullable();
            table.foreign('listing_item_template_id').references('id')
                .inTable('listing_item_templates');

            table.boolean('removed').notNullable().defaultTo(false);
            table.integer('expiry_time').unsigned();
            table.integer('generated_at').unsigned().notNullable();
            table.integer('received_at').unsigned().notNullable();
            table.integer('posted_at').unsigned().notNullable();
            table.integer('expired_at').unsigned().notNullable();

            table.timestamp('updated_at').defaultTo(db.fn.now());
            table.timestamp('created_at').defaultTo(db.fn.now());

            table.unique(['msgid', 'seller', 'market']);
        })
    ]);
};

exports.down = (db: Knex): Promise<any> => {
    return Promise.all([
        db.schema.dropTable('listing_items')
    ]);
};
