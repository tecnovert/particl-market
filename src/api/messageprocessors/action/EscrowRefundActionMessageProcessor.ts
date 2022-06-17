// Copyright (c) 2017-2022, The Particl Market developers
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
import { EscrowRefundActionService } from '../../services/action/EscrowRefundActionService';
// import { EscrowRefundMessage } from '../../messages/action/EscrowRefundMessage';
import { ProposalService } from '../../services/model/ProposalService';
import { BaseBidActionMessageProcessor } from '../BaseBidActionMessageProcessor';
import { EscrowRefundValidator } from '../../messagevalidators/EscrowRefundValidator';
import { ActionDirection } from '../../enums/ActionDirection';
import { NotificationService } from '../../services/model/NotificationService';


export class EscrowRefundActionMessageProcessor extends BaseBidActionMessageProcessor implements ActionMessageProcessorInterface {

    public static Event = Symbol(MPActionExtended.MPA_REFUND);

    constructor(
        @inject(Types.Service) @named(Targets.Service.action.EscrowRefundActionService) public escrowRefundActionService: EscrowRefundActionService,
        @inject(Types.Service) @named(Targets.Service.model.SmsgMessageService) public smsgMessageService: SmsgMessageService,
        @inject(Types.Service) @named(Targets.Service.model.BidService) public bidService: BidService,
        @inject(Types.Service) @named(Targets.Service.model.ProposalService) public proposalService: ProposalService,
        @inject(Types.Service) @named(Targets.Service.model.NotificationService) public notificationService: NotificationService,
        @inject(Types.Service) @named(Targets.Service.model.ListingItemService) public listingItemService: ListingItemService,
        @inject(Types.Factory) @named(Targets.Factory.model.BidFactory) public bidFactory: BidFactory,
        @inject(Types.MessageValidator) @named(Targets.MessageValidator.EscrowRefundValidator) public validator: EscrowRefundValidator,
        @inject(Types.Core) @named(Core.Logger) Logger: typeof LoggerType
    ) {
        super(MPActionExtended.MPA_REFUND,
            escrowRefundActionService,
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
     * handles the received EscrowRefundMessage and return SmsgMessageStatus as a result
     *
     * @param event
     */
    public async onEvent(event: MarketplaceMessageEvent): Promise<SmsgMessageStatus> {

        const smsgMessage: resources.SmsgMessage = event.smsgMessage;
        const marketplaceMessage: MarketplaceMessage = event.marketplaceMessage;
        // const actionMessage: EscrowRefundMessage = marketplaceMessage.action as EscrowRefundMessage;

        // - first get the previous Bid (MPA_BID), fail if it doesn't exist
        // - then get the ListingItem the Bid is for, fail if it doesn't exist
        // - then, save the new Bid (MPA_REFUND) and update the OrderItem.status and Order.status

        return await this.escrowRefundActionService.processMessage(marketplaceMessage, ActionDirection.INCOMING, smsgMessage)
            .then(() => SmsgMessageStatus.PROCESSED)
            .catch(() => SmsgMessageStatus.PROCESSING_FAILED);
    }
}
