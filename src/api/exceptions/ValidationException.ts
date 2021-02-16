// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

/**
 * ValidationException
 * ----------------------------------------
 *
 * This should be used when we validate
 * the request payload, so we can response with a 400 (Bad Request)
 */

import { Exception } from '../../core/api/Exception';


export class ValidationException extends Exception {
    constructor(text: string, errors: any) {
        const info = errors.map((e) => ({
            property: e.property,
            constraints: e.constraints
        }));
        super(400, text, info);
    }
}
