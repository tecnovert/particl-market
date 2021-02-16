// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { IsNotEmpty } from 'class-validator';
import { RequestBody } from '../../../core/api/RequestBody';
import { CreatableModel } from '../../enums/CreatableModel';

// tslint:disable:variable-name
export class TestDataGenerateRequest extends RequestBody {

    @IsNotEmpty()
    public model: CreatableModel;

    @IsNotEmpty()
    public amount: number;

    @IsNotEmpty()
    public withRelated: boolean;

    public generateParams: any[];

}
// tslint:enable:variable-name
