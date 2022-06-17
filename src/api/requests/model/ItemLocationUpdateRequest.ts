// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { IsNotEmpty } from 'class-validator';
import { RequestBody } from '../../../core/api/RequestBody';
import { LocationMarkerUpdateRequest } from './LocationMarkerUpdateRequest';
import { ModelRequestInterface } from './ModelRequestInterface';


export class ItemLocationUpdateRequest extends RequestBody implements ModelRequestInterface {

    @IsNotEmpty()
    public country: string;
    public address: string;
    public description: string;

    public locationMarker: LocationMarkerUpdateRequest;

}
