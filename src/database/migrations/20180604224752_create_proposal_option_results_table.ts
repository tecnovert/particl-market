// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Knex from 'knex';


exports.up = (db: Knex): Promise<any> => {
    return Promise.all([
        db.schema.createTable('proposal_option_results', (table: Knex.CreateTableBuilder) => {
            table.increments('id').primary();

            table.integer('proposal_result_id').unsigned().notNullable();
            table.foreign('proposal_result_id').references('id')
                .inTable('proposal_results').onDelete('cascade');

            table.integer('proposal_option_id').unsigned().notNullable();
            table.foreign('proposal_option_id').references('id')
                .inTable('proposal_options');

            table.integer('weight').notNullable();
            table.integer('voters').notNullable();

            table.timestamp('updated_at').defaultTo(db.fn.now());
            table.timestamp('created_at').defaultTo(db.fn.now());
        })
    ]);
};

exports.down = (db: Knex): Promise<any> => {
    return Promise.all([
        db.schema.dropTable('proposal_option_results')
    ]);
};
