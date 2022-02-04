// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { IsNotEmpty } from 'class-validator';
import { RequestBody } from '../../../core/api/RequestBody';
import { SmsgMessageStatus } from '../../enums/SmsgMessageStatus';
import { ActionMessageTypes } from '../../enums/ActionMessageTypes';
import { ActionDirection } from '../../enums/ActionDirection';
import { ModelRequestInterface } from './ModelRequestInterface';

// tslint:disable:variable-name
export class SmsgMessageCreateRequest extends RequestBody implements ModelRequestInterface {

    @IsNotEmpty()
    public type: ActionMessageTypes;

    @IsNotEmpty()
    public status: SmsgMessageStatus;

    @IsNotEmpty()
    public direction: ActionDirection;

    public target: string;

    @IsNotEmpty()
    public msgid: string;

    @IsNotEmpty()
    public version: string;

    public read: boolean;
    public paid: boolean;
    public payloadsize: number;

    @IsNotEmpty()
    public received: number;

    @IsNotEmpty()
    public sent: number;

    @IsNotEmpty()
    public expiration: number;

    @IsNotEmpty()
    public daysretention: number;

    @IsNotEmpty()
    public from: string;

    @IsNotEmpty()
    public to: string;

    @IsNotEmpty()
    public text: string;

    public processedCount: number;
    public processedAt: number;

    // these are only here because we need to set these manually since knex doesn't set these in correct format
    public updated_at: number;
    public created_at: number;
}
// tslint:enable:variable-name
