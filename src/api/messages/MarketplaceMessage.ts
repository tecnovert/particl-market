// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

// tslint:disable:variable-name
import { MPM } from '@zasmilingidiot/omp-lib/dist/interfaces/omp';
import { ActionMessageInterface } from './action/ActionMessageInterface';


/**
 * MarketplaceMessage is the type of message the market listens to
 */
export class MarketplaceMessage implements Omit<MPM, 'action'> {
    public version: string;
    public action: ActionMessageInterface;
    // tslint:disable-next-line:variable-name
    public _rawtx?: string;
}
// tslint:enable:variable-name
