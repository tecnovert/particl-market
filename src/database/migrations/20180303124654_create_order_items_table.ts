// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Knex from 'knex';


exports.up = (db: Knex): Promise<any> => {
    return Promise.all([
        db.schema.createTable('order_items', (table: Knex.CreateTableBuilder) => {
            table.increments('id').primary();

            table.string('status').notNullable();
            table.string('item_hash').notNullable();

            table.integer('order_id').unsigned().notNullable();
            table.foreign('order_id').references('id')
                .inTable('orders');

            table.integer('bid_id').unsigned().notNullable();
            table.foreign('bid_id').references('id')
                .inTable('bids');

            // table.integer('listing_item_id').unsigned().notNullable();
            // table.foreign('listing_item_id').references('id')
            //    .inTable('listing_items');

            table.timestamp('updated_at').defaultTo(db.fn.now());
            table.timestamp('created_at').defaultTo(db.fn.now());
        })
    ]);
};

exports.down = (db: Knex): Promise<any> => {
    return Promise.all([
        db.schema.dropTable('order_items')
    ]);
};
