// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

// tslint:disable:variable-name
import { MPM } from '@zasmilingidiot/omp-lib/dist/interfaces/omp';
import { ActionMessageInterface } from './action/ActionMessageInterface';

/**
 * MPMExtension defines how the MPM will be extended
 * (adds support for ActionMessageInterface which adds support for actions other than just the MPAction)
 */
interface MPMExtension {
    action: ActionMessageInterface;
}

/**
 * MPMExtended is the result of overewriting the MPM with MPMExtension
 */
interface MPMExtended extends Overwrite<MPM, MPMExtension> {}

/**
 * MarketplaceMessage is the type of message the market listens to
 */
export class MarketplaceMessage implements MPMExtended {
    public version: string;
    public action: ActionMessageInterface;
    // tslint:disable-next-line:variable-name
    public _rawtx?: string;
}
// tslint:enable:variable-name
