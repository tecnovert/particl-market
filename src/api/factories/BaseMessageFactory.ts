// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { ompVersion } from '@zasmilingidiot/omp-lib/dist/omp';
import { MessageFactoryInterface } from './MessageFactoryInterface';
import { MarketplaceMessage } from '../messages/MarketplaceMessage';
import { ActionRequestInterface } from '../requests/action/ActionRequestInterface';
import { ActionMessageInterface } from '../messages/action/ActionMessageInterface';


export abstract class BaseMessageFactory implements MessageFactoryInterface {

    public abstract get(actionRequest: ActionRequestInterface): Promise<MarketplaceMessage>;

    public async getMarketplaceMessage(actionMessage: ActionMessageInterface): Promise<MarketplaceMessage> {
        return {
            version: ompVersion(),
            action: actionMessage
        } as MarketplaceMessage;
    }
}
