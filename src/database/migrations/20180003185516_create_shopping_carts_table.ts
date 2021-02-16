// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Knex from 'knex';


exports.up = (db: Knex): Promise<any> => {
    return Promise.all([
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
};

exports.down = (db: Knex): Promise<any> => {
    return Promise.all([
        db.schema.dropTable('shopping_carts')
    ]);
};
