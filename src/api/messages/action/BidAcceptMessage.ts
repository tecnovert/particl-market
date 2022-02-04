// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { IsEnum, IsNotEmpty } from 'class-validator';
import { ActionMessageInterface } from './ActionMessageInterface';
import { MessageBody } from '../../../core/api/MessageBody';
import { MPAction } from '@zasmilingidiot/omp-lib/dist/interfaces/omp-enums';
import { MPA_ACCEPT, PaymentDataAccept} from '@zasmilingidiot/omp-lib/dist/interfaces/omp';
import { KVS } from '@zasmilingidiot/omp-lib/dist/interfaces/common';

export class BidAcceptMessage extends MessageBody implements ActionMessageInterface, MPA_ACCEPT {

    @IsEnum(MPAction)
    @IsNotEmpty()
    public type: MPAction.MPA_ACCEPT;

    @IsNotEmpty()
    public bid: string;

    @IsNotEmpty()
    public seller: {
        payment: PaymentDataAccept;
    };

    public objects: KVS[] = [];

    @IsNotEmpty()
    public generated: number;
    @IsNotEmpty()
    public hash: string;

}
