// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Knex from 'knex';


exports.up = (db: Knex): Promise<any> =>
    Promise.all([
        db.schema.createTable('favorite_items', (table: Knex.CreateTableBuilder) => {
            table.increments('id').primary();

            table.integer('listing_item_id').unsigned().notNullable();
            table.foreign('listing_item_id').references('id')
                .inTable('listing_items').onDelete('CASCADE');

            table.integer('profile_id').unsigned().notNullable();
            table.foreign('profile_id').references('id')
                .inTable('profiles').onDelete('CASCADE');

            table.timestamp('updated_at').defaultTo(db.fn.now());
            table.timestamp('created_at').defaultTo(db.fn.now());

            table.unique(['listing_item_id', 'profile_id']);
        })
    ]);


exports.down = (db: Knex): Promise<any> =>
    Promise.all([
        db.schema.dropTable('favorite_items')
    ]);
