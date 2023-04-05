// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { IsNotEmpty } from 'class-validator';
import { RequestBody } from '../../../core/api/RequestBody';
import { ModelRequestInterface } from './ModelRequestInterface';

// tslint:disable:variable-name
export class ShoppingCartCreateRequest extends RequestBody implements ModelRequestInterface {
    @IsNotEmpty()
    public name: string;

    @IsNotEmpty()
    public identity_id: number;
}
// tslint:enable:variable-name
