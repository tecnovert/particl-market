// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { MessageBody } from '../../../core/api/MessageBody';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ActionMessageInterface } from './ActionMessageInterface';
import { GovernanceAction } from '../../enums/GovernanceAction';
import { KVS } from '@zasmilingidiot/omp-lib/dist/interfaces/common';

export class VoteMessage extends MessageBody implements ActionMessageInterface {

    @IsNotEmpty()
    @IsEnum(GovernanceAction)
    public type: GovernanceAction.MPA_VOTE;
    @IsNotEmpty()
    public proposalHash: string;
    @IsNotEmpty()
    public proposalOptionHash: string;
    @IsNotEmpty()
    public voter: string;
    @IsNotEmpty()
    public signature: string;

    public objects?: KVS[];

    // all ActionMessages have these
    @IsNotEmpty()
    public hash: string;
    @IsNotEmpty()
    public generated: number;
}
