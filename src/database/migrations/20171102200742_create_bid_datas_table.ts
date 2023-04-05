// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Knex from 'knex';


exports.up = (db: Knex): Promise<any> =>
    Promise.all([
        db.schema.createTable('bid_datas', (table: Knex.CreateTableBuilder) => {
            table.increments('id').primary();

            table.string('key');
            table.string('value');
            table.integer('bid_id').unsigned().notNullable();
            table.foreign('bid_id').references('id')
                .inTable('bids').onDelete('cascade');

            table.timestamp('updated_at').defaultTo(db.fn.now());
            table.timestamp('created_at').defaultTo(db.fn.now());
        })
    ]);


exports.down = (db: Knex): Promise<any> =>
    Promise.all([
        db.schema.dropTable('bid_datas')
    ]);
