// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { ActionRequestInterface } from '../requests/action/ActionRequestInterface';
import { MarketplaceMessage } from '../messages/MarketplaceMessage';

export interface MessageFactoryInterface {
    get(actionRequest: ActionRequestInterface): Promise<MarketplaceMessage>;
}
