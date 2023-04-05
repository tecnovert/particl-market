// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { RequestBody } from '../../../core/api/RequestBody';
import { ModelRequestInterface } from './ModelRequestInterface';
import {IdentityType} from '../../enums/IdentityType';


export class IdentityUpdateRequest extends RequestBody implements ModelRequestInterface {

    public wallet: string;
    public address: string;
    public hdseedid: string;
    public path: string;
    public mnemonic: string;
    public passphrase: string;
    public type: IdentityType;

}
