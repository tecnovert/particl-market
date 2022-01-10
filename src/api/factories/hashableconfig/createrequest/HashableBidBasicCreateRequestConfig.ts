// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { BaseHashableConfig, HashableFieldConfig, HashableFieldValueConfig } from 'omp-lib/dist/interfaces/configs';
import { HashableBidField, HashableCommonField } from 'omp-lib/dist/interfaces/omp-enums';

// TODO: rename
export class HashableBidBasicCreateRequestConfig extends BaseHashableConfig {

    public fields = [{
        from: 'generatedAt',
        to: HashableCommonField.GENERATED
    }] as HashableFieldConfig[];

    constructor(values: HashableFieldValueConfig[]) {
        super(values);
    }
}
