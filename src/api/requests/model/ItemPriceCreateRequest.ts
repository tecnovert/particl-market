// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import {IsNotEmpty, IsEnum } from 'class-validator';
import { RequestBody } from '../../../core/api/RequestBody';
import { Cryptocurrency } from '@zasmilingidiot/omp-lib/dist/interfaces/crypto';
import { ShippingPriceCreateRequest } from './ShippingPriceCreateRequest';
import { CryptocurrencyAddressCreateRequest } from './CryptocurrencyAddressCreateRequest';
import { ModelRequestInterface } from './ModelRequestInterface';


export class ItemPriceCreateRequest extends RequestBody implements ModelRequestInterface {

    @IsNotEmpty()
    public payment_information_id: number;
    public cryptocurrency_address_id: number;

    @IsEnum(Cryptocurrency)
    @IsNotEmpty()
    public currency: Cryptocurrency;

    public basePrice: number;

    public shippingPrice: ShippingPriceCreateRequest;

    public cryptocurrencyAddress: CryptocurrencyAddressCreateRequest;
}
