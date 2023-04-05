// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { IsNotEmpty, IsEnum } from 'class-validator';
import { RequestBody } from '../../../core/api/RequestBody';
import { Cryptocurrency } from '@zasmilingidiot/omp-lib/dist/interfaces/crypto';
import { ShippingPriceUpdateRequest } from './ShippingPriceUpdateRequest';
import { CryptocurrencyAddressUpdateRequest } from './CryptocurrencyAddressUpdateRequest';
import { ModelRequestInterface } from './ModelRequestInterface';

// tslint:disable:variable-name
export class ItemPriceUpdateRequest extends RequestBody implements ModelRequestInterface {

    public payment_information_id: number;
    public cryptocurrency_address_id: number;

    @IsEnum(Cryptocurrency)
    @IsNotEmpty()
    public currency: Cryptocurrency;

    @IsNotEmpty()
    public basePrice: number;

    public shippingPrice: ShippingPriceUpdateRequest;

    public cryptocurrencyAddress: CryptocurrencyAddressUpdateRequest;
}
// tslint:enable:variable-name
