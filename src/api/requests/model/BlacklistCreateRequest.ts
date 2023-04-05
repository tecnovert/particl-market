// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { IsNotEmpty } from 'class-validator';
import { RequestBody } from '../../../core/api/RequestBody';
import { ModelRequestInterface } from './ModelRequestInterface';
import { BlacklistType } from '../../enums/BlacklistType';

// tslint:disable:variable-name
export class BlacklistCreateRequest extends RequestBody implements ModelRequestInterface {

    @IsNotEmpty()
    public type: BlacklistType;

    @IsNotEmpty()
    public target: string;              // target hash/whatever to blacklist
    public market: string;              // optional market to be blacklisted on

    public profile_id: number;          // optional profile to have relation to

    public listing_item_id: number;     // optional listingitem to have relation to
    public market_id: number;           // optional market to have relation to
}
// tslint:enable:variable-name
