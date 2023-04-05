// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as resources from 'resources';
import { inject, named } from 'inversify';
import { Types, Core, Targets } from '../../../constants';
import { Logger as LoggerType } from '../../../core/Logger';
import { SmsgMessageStatus } from '../../enums/SmsgMessageStatus';
import { MarketplaceMessageEvent } from '../../messages/MarketplaceMessageEvent';
import { SmsgMessageService } from '../../services/model/SmsgMessageService';
import { MarketplaceMessage } from '../../messages/MarketplaceMessage';
import { ListingItemService } from '../../services/model/ListingItemService';
import { ActionMessageProcessorInterface } from '../ActionMessageProcessorInterface';
import { BidFactory } from '../../factories/model/BidFactory';
import { BidService } from '../../services/model/BidService';
import { MPActionExtended } from '../../enums/MPActionExtended';
// import { EscrowCompleteMessage } from '../../messages/action/EscrowCompleteMessage';
import { EscrowCompleteActionService } from '../../services/action/EscrowCompleteActionService';
import { ProposalService } from '../../services/model/ProposalService';
import { BaseBidActionMessageProcessor } from '../BaseBidActionMessageProcessor';
import { EscrowCompleteValidator } from '../../messagevalidators/EscrowCompleteValidator';
import { ActionDirection } from '../../enums/ActionDirection';
import { NotificationService } from '../../services/model/NotificationService';


export class EscrowCompleteActionMessageProcessor extends BaseBidActionMessageProcessor implements ActionMessageProcessorInterface {

    public static Event = Symbol(MPActionExtended.MPA_COMPLETE);

    constructor(
        @inject(Types.Service) @named(Targets.Service.action.EscrowCompleteActionService) public escrowCompleteActionService: EscrowCompleteActionService,
        @inject(Types.Service) @named(Targets.Service.model.SmsgMessageService) public smsgMessageService: SmsgMessageService,
        @inject(Types.Service) @named(Targets.Service.model.BidService) public bidService: BidService,
        @inject(Types.Service) @named(Targets.Service.model.ProposalService) public proposalService: ProposalService,
        @inject(Types.Service) @named(Targets.Service.model.NotificationService) public notificationService: NotificationService,
        @inject(Types.Service) @named(Targets.Service.model.ListingItemService) public listingItemService: ListingItemService,
        @inject(Types.Factory) @named(Targets.Factory.model.BidFactory) public bidFactory: BidFactory,
        @inject(Types.MessageValidator) @named(Targets.MessageValidator.EscrowCompleteValidator) public validator: EscrowCompleteValidator,
        @inject(Types.Core) @named(Core.Logger) Logger: typeof LoggerType
    ) {
        super(MPActionExtended.MPA_COMPLETE,
            escrowCompleteActionService,
            smsgMessageService,
            bidService,
            proposalService,
            notificationService,
            validator,
            listingItemService,
            bidFactory,
            Logger
        );
    }

    /**
     * handles the received EscrowCompleteMessage and return SmsgMessageStatus as a result
     *
     * @param event
     */
    public async onEvent(event: MarketplaceMessageEvent): Promise<SmsgMessageStatus> {

        const smsgMessage: resources.SmsgMessage = event.smsgMessage;
        const marketplaceMessage: MarketplaceMessage = event.marketplaceMessage;
        // const actionMessage: EscrowCompleteMessage = marketplaceMessage.action as EscrowCompleteMessage;

        return await this.escrowCompleteActionService.processMessage(marketplaceMessage, ActionDirection.INCOMING, smsgMessage)
            .then(() => SmsgMessageStatus.PROCESSED)
            .catch(() => SmsgMessageStatus.PROCESSING_FAILED);
    }
}
