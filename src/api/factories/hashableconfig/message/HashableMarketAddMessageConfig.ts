// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { BaseHashableConfig, HashableFieldConfig, HashableFieldValueConfig } from '@zasmilingidiot/omp-lib/dist/interfaces/configs';
import { HashableMarketField } from '../HashableField';

export class HashableMarketAddMessageConfig extends BaseHashableConfig {

    public fields = [/* {
            from: HashableCommonField.GENERATED,
            to: HashableCommonField.GENERATED
        }, */{
            from: HashableMarketField.MARKET_NAME,
            to: HashableMarketField.MARKET_NAME
        }, {
            from: HashableMarketField.MARKET_DESCRIPTION,
            to: HashableMarketField.MARKET_DESCRIPTION
        }
        /*
        MARKET_RECEIVE_ADDRESS and MARKET_PUBLISH_ADDRESS should be passed to the hasher
        {
            from: HashableMarketAddField.MARKET_TYPE,       // marketType -> type
            to: HashableMarketField.MARKET_TYPE
        }, {
            from: HashableMarketField.MARKET_RECEIVE_ADDRESS,
            to: HashableMarketField.MARKET_RECEIVE_ADDRESS
        }, {
            from: HashableMarketField.MARKET_PUBLISH_ADDRESS,
            to: HashableMarketField.MARKET_PUBLISH_ADDRESS
        }, {
            from: HashableMarketAddField.MARKET_IMAGE_HASH,
            to: HashableMarketField.MARKET_IMAGE_HASH
        }*/
        // TODO: maybe later
    ] as HashableFieldConfig[];

    constructor(values?: HashableFieldValueConfig[]) {
        super(values);
    }
}
