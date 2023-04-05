// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { IsNotEmpty } from 'class-validator';
import { RequestBody } from '../../../core/api/RequestBody';
import { ModelRequestInterface } from './ModelRequestInterface';

// tslint:disable:variable-name
export class PriceTickerUpdateRequest extends RequestBody implements ModelRequestInterface {

    @IsNotEmpty()
    public crypto_id: string;

    @IsNotEmpty()
    public crypto_name: string;

    @IsNotEmpty()
    public crypto_symbol: string;

    @IsNotEmpty()
    public crypto_rank: string;



    @IsNotEmpty()
    public crypto_price_usd: string;

    @IsNotEmpty()
    public crypto_price_btc: string;



    public crypto_24h_volume_usd: string;

    public crypto_market_cap_usd: string;

    public crypto_available_supply: string;

    public crypto_total_supply: string;

    public crypto_max_supply: string | null;



    public crypto_percent_change_1h: string;

    public crypto_percent_change_24h: string;

    public crypto_percent_change_7d: string;



    public crypto_last_updated: string;

    @IsNotEmpty()
    public crypto_price_eur: string;

    @IsNotEmpty()
    public crypto_24h_volume_eur: string;

    @IsNotEmpty()
    public crypto_market_cap_eur: string;
}
// tslint:enable:variable-name
