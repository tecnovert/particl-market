// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { IsNotEmpty, IsEnum } from 'class-validator';
import { RequestBody } from '../../../core/api/RequestBody';
import { ListingItemObjectType } from '../../enums/ListingItemObjectType';
import { ListingItemObjectDataCreateRequest } from './ListingItemObjectDataCreateRequest';
import { ModelRequestInterface } from './ModelRequestInterface';

// tslint:disable:variable-name
export class ListingItemObjectCreateRequest extends RequestBody implements ModelRequestInterface {

    public listing_item_id: number;
    public listing_item_template_id: number;

    @IsEnum(ListingItemObjectType)
    @IsNotEmpty()
    public type: ListingItemObjectType;

    @IsNotEmpty()
    public description: string;

    @IsNotEmpty()
    public order: number;

    public listingItemObjectDatas: ListingItemObjectDataCreateRequest[];
}
// tslint:enable:variable-name
