// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { Bookshelf } from '../../config/Database';
import { CurrencyPriceSearchParams } from '../requests/search/CurrencyPriceSearchParams';

export class CurrencyPrice extends Bookshelf.Model<CurrencyPrice> {

    public static async fetchById(value: number, withRelated: boolean = true): Promise<CurrencyPrice> {
        if (withRelated) {
            return await CurrencyPrice.where<CurrencyPrice>({ id: value }).fetch({
                withRelated: []
            });
        } else {
            return await CurrencyPrice.where<CurrencyPrice>({ id: value }).fetch();
        }
    }

    // find currency price by from currency and to currency
    public static async search(options: CurrencyPriceSearchParams): Promise<CurrencyPrice> {
        return await CurrencyPrice.where<CurrencyPrice>({ from: options.from, to: options.to}).fetch();
    }

    public get tableName(): string { return 'currency_prices'; }
    public get hasTimestamps(): boolean { return true; }

    public get Id(): number { return this.get('id'); }
    public set Id(value: number) { this.set('id', value); }

    public get From(): string { return this.get('from'); }
    public set From(value: string) { this.set('from', value); }

    public get To(): string { return this.get('to'); }
    public set To(value: string) { this.set('to', value); }

    public get Price(): number { return this.get('price'); }
    public set Price(value: number) { this.set('price', value); }

    public get UpdatedAt(): Date { return this.get('updatedAt'); }
    public set UpdatedAt(value: Date) { this.set('updatedAt', value); }

    public get CreatedAt(): Date { return this.get('createdAt'); }
    public set CreatedAt(value: Date) { this.set('createdAt', value); }

}
