// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { IsNotEmpty } from 'class-validator';
import { RequestBody } from '../../../core/api/RequestBody';
import { ModelRequestInterface } from './ModelRequestInterface';
import { MarketType } from '../../enums/MarketType';
import { ImageCreateRequest } from './ImageCreateRequest';

// tslint:disable:variable-name
export class MarketCreateRequest extends RequestBody implements ModelRequestInterface {

    // @IsNotEmpty()
    public identity_id: number;

    // @IsNotEmpty()
    public profile_id: number;

    public msgid: string;
    public hash: string;

    @IsNotEmpty()
    public name: string;
    public description: string;

    @IsNotEmpty()
    public type: MarketType;

    public region: string;

    @IsNotEmpty()
    public receiveKey: string;

    @IsNotEmpty()
    public receiveAddress: string;

    public publishKey: string;
    public publishAddress: string;

    public removed: boolean;
    public expiryTime: number;
    public generatedAt: number;
    public receivedAt: number;
    public postedAt: number;
    public expiredAt: number;

    public image_id: number;
    public image: ImageCreateRequest;

}
// tslint:enable:variable-name
