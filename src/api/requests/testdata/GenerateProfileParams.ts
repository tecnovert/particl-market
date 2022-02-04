// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';

export interface GenerateProfileParamsInterface {
    generateShippingAddresses: boolean;
    generateCryptocurrencyAddresses: boolean;
    generateSettings: boolean;
    toParamsArray(): boolean[];
}

export class GenerateProfileParams implements GenerateProfileParamsInterface {

    // GenerateProfileParamsInterface
    public generateShippingAddresses = true;
    public generateCryptocurrencyAddresses = true;
    public generateSettings = true;

    /**
     * generateParams[]:
     * [0]: generateShippingAddresses
     * [1]: generateCryptocurrencyAddresses
     * [2]: generateSettings
     *
     * @param generateParams
     */
    constructor(generateParams: boolean[] = []) {
        // set params only if there are some -> by default all are true
        if (!_.isEmpty(generateParams) ) {
            this.generateShippingAddresses          = generateParams[0] ? true : false;
            this.generateCryptocurrencyAddresses    = generateParams[1] ? true : false;
            this.generateSettings                   = generateParams[2] ? true : false;
        }
    }

    public toParamsArray(): boolean[] {
        return [this.generateShippingAddresses, this.generateCryptocurrencyAddresses, this.generateSettings];
    }

}
