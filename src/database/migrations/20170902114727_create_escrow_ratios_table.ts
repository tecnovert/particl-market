// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Knex from 'knex';


exports.up = (db: Knex): Promise<any> =>
    Promise.all([
        db.schema.createTable('escrow_ratios', (table: Knex.CreateTableBuilder) => {
            table.increments('id').primary();

            table.integer('buyer').notNullable();
            table.integer('seller').notNullable();

            table.integer('escrow_id').unsigned();
            table.foreign('escrow_id').references('id')
                .inTable('escrows').onDelete('cascade');

            table.timestamp('updated_at').defaultTo(db.fn.now());
            table.timestamp('created_at').defaultTo(db.fn.now());
        })
    ]);


exports.down = (db: Knex): Promise<any> =>
    Promise.all([
        db.schema.dropTable('escrow_ratios')
    ]);
