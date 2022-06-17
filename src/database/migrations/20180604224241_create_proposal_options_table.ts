// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Knex from 'knex';


exports.up = (db: Knex): Promise<any> =>
    Promise.all([
        db.schema.createTable('proposal_options', (table: Knex.CreateTableBuilder) => {
            table.increments('id').primary();

            table.integer('proposal_id').unsigned().notNullable();
            table.foreign('proposal_id').references('id')
                .inTable('proposals').onDelete('cascade');

            table.integer('option_id').notNullable();
            table.string('description').notNullable();
            table.string('hash').notNullable();

            table.timestamp('updated_at').defaultTo(db.fn.now());
            table.timestamp('created_at').defaultTo(db.fn.now());
        })
    ]);


exports.down = (db: Knex): Promise<any> =>
    Promise.all([
        db.schema.dropTable('proposal_options')
    ]);
