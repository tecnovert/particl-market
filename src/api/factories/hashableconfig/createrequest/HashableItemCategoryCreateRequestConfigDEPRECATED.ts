// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { BaseHashableConfig, HashableFieldConfig, HashableFieldValueConfig } from '@zasmilingidiot/omp-lib/dist/interfaces/configs';
import { HashableItemCategoryField } from '../HashableField';


export class HashableItemCategoryCreateRequestConfigDEPRECATED extends BaseHashableConfig {

    public fields = [{
        from: 'name',
        to: HashableItemCategoryField.CATEGORY_NAME
    }, {
        from: 'market',
        to: HashableItemCategoryField.CATEGORY_MARKET
    }] as HashableFieldConfig[];

    constructor(values?: HashableFieldValueConfig[]) {
        super(values);
    }
}
