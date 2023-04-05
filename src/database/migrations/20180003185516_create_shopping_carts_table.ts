// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Knex from 'knex';


exports.up = (db: Knex): Promise<any> =>
    Promise.all([
        db.schema.createTable('shopping_carts', (table: Knex.CreateTableBuilder) => {
            table.increments('id').primary();

            table.string('name').notNullable();

            table.integer('identity_id').unsigned().notNullable();
            table.foreign('identity_id').references('id')
                .inTable('identities').onDelete('CASCADE');

            table.timestamp('updated_at').defaultTo(db.fn.now());
            table.timestamp('created_at').defaultTo(db.fn.now());
        })
    ]);


exports.down = (db: Knex): Promise<any> =>
    Promise.all([
        db.schema.dropTable('shopping_carts')
    ]);
