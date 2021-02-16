// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { IsNotEmpty, IsEnum } from 'class-validator';
import { RequestBody } from '../../../core/api/RequestBody';
import { CryptoAddressType } from 'omp-lib/dist/interfaces/crypto';
import { ModelRequestInterface } from './ModelRequestInterface';

// tslint:disable:variable-name
export class CryptocurrencyAddressCreateRequest extends RequestBody implements ModelRequestInterface {

    public profile_id: number;

    @IsEnum(CryptoAddressType)
    @IsNotEmpty()
    public type: CryptoAddressType;

    @IsNotEmpty()
    public address: string;

}
// tslint:enable:variable-name
