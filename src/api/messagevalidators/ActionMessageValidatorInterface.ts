// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as resources from 'resources';
import { MarketplaceMessage } from '../messages/MarketplaceMessage';
import { ActionDirection } from '../enums/ActionDirection';

export interface ActionMessageValidatorInterface {

    /**
     * called before posting (BaseActionService.post) and after receiving (BaseActionMessageProcessor.process) the message
     * to make sure the message contents are valid
     *
     * @param marketplaceMessage
     * @param direction
     * @param smsgMessage, only passed when receiving a message
     */
    validateMessage(marketplaceMessage: MarketplaceMessage, direction: ActionDirection, smsgMessage?: resources.SmsgMessage): Promise<boolean>;

    /**
     * called after validateMessage and after receiving (BaseActionMessageProcessor.process) the message
     * to make sure the message sequence is valid
     *
     * @param marketplaceMessage
     * @param direction
     * @param smsgMessage, only passed when receiving a message
     */
    validateSequence(marketplaceMessage: MarketplaceMessage, direction: ActionDirection, smsgMessage?: resources.SmsgMessage): Promise<boolean>;
}
