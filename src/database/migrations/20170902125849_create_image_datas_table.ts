// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Knex from 'knex';


exports.up = (db: Knex): Promise<any> =>
    Promise.all([
        db.schema.createTable('image_datas', (table: Knex.CreateTableBuilder) => {
            table.increments('id').primary();

            table.string('protocol'); // .notNullable();
            table.string('encoding'); // .notNullable();

            table.string('image_version').notNullable();
            table.string('image_hash').notNullable();

            table.string('data_id'); // .notNullable();
            table.text('data'); // .notNullable();

            table.integer('image_id').unsigned();
            table.foreign('image_id').references('id')
                .inTable('images').onDelete('cascade');

            table.timestamp('updated_at').defaultTo(db.fn.now());
            table.timestamp('created_at').defaultTo(db.fn.now());

            table.string('original_mime'); // .notNullable();
            table.string('original_name'); // .notNullable();
        })
    ]);


exports.down = (db: Knex): Promise<any> =>
    Promise.all([
        db.schema.dropTable('image_datas')
    ]);
