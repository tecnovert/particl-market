// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { Cryptocurrency } from '@zasmilingidiot/omp-lib/dist/interfaces/crypto';

declare module 'resources' {

    interface ItemPrice {
        id: number;
        currency: Cryptocurrency;
        basePrice: number;
        createdAt: Date;
        updatedAt: Date;
        ShippingPrice: ShippingPrice;
        CryptocurrencyAddress: CryptocurrencyAddress;
    }

}
