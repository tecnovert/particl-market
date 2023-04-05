// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Knex from 'knex';


exports.up = (db: Knex): Promise<any> =>
    Promise.all([
        db.schema.table('item_informations', (table: Knex.AlterTableBuilder) => {
            table.string('product_code').nullable();
        })
    ]);


exports.down = (db: Knex): Promise<any> =>
    Promise.all([
        db.schema.table('item_informations', (table: Knex.AlterTableBuilder) => {
            table.dropColumn('product_code');
        })
    ]);
