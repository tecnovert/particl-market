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
import { OrderItemShipActionService } from '../../services/action/OrderItemShipActionService';
import { OrderItemShipMessage } from '../../messages/action/OrderItemShipMessage';
import { ProposalService } from '../../services/model/ProposalService';
import { OrderItemStatus } from '../../enums/OrderItemStatus';
import { OrderStatus } from '../../enums/OrderStatus';
import { BaseBidActionMessageProcessor } from '../BaseBidActionMessageProcessor';
import { OrderItemShipValidator } from '../../messagevalidators/OrderItemShipValidator';
import { ActionDirection } from '../../enums/ActionDirection';
import { NotificationService } from '../../services/model/NotificationService';


export class OrderItemShipActionMessageProcessor extends BaseBidActionMessageProcessor implements ActionMessageProcessorInterface {

    public static Event = Symbol(MPActionExtended.MPA_SHIP);

    constructor(
        @inject(Types.Service) @named(Targets.Service.action.OrderItemShipActionService) public orderItemShipActionService: OrderItemShipActionService,
        @inject(Types.Service) @named(Targets.Service.model.SmsgMessageService) public smsgMessageService: SmsgMessageService,
        @inject(Types.Service) @named(Targets.Service.model.BidService) public bidService: BidService,
        @inject(Types.Service) @named(Targets.Service.model.ProposalService) public proposalService: ProposalService,
        @inject(Types.Service) @named(Targets.Service.model.NotificationService) public notificationService: NotificationService,
        @inject(Types.Service) @named(Targets.Service.model.ListingItemService) public listingItemService: ListingItemService,
        @inject(Types.Factory) @named(Targets.Factory.model.BidFactory) public bidFactory: BidFactory,
        @inject(Types.MessageValidator) @named(Targets.MessageValidator.OrderItemShipValidator) public validator: OrderItemShipValidator,
        @inject(Types.Core) @named(Core.Logger) Logger: typeof LoggerType
    ) {
        super(MPActionExtended.MPA_SHIP,
            orderItemShipActionService,
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
     * handles the received OrderItemShipMessage and return SmsgMessageStatus as a result
     *
     * @param event
     */
    public async onEvent(event: MarketplaceMessageEvent): Promise<SmsgMessageStatus> {

        const smsgMessage: resources.SmsgMessage = event.smsgMessage;
        const marketplaceMessage: MarketplaceMessage = event.marketplaceMessage;
        const actionMessage: OrderItemShipMessage = marketplaceMessage.action as OrderItemShipMessage;

        // - first get the previous Bid (MPA_BID), fail if it doesn't exist
        // - then get the ListingItem the Bid is for, fail if it doesn't exist
        // - then, save the new Bid (MPA_SHIP)
        // - then, update the OrderItem.status and Order.status

        const mpaBid: resources.Bid = await this.bidService.findOneByHash(actionMessage.bid)
            .then(value => value.toJSON())
            .catch(reason => {
                // could not find previous bid
                this.log.error('ERROR, reason: ', reason);
                return SmsgMessageStatus.PROCESSING_FAILED;
            });

        // dont allow the MPA_SHIP to be processed before MPA_COMPLETE is received
        // MPA_COMPLETE sets OrderStatus.PROCESSING && OrderItemStatus.ESCROW_COMPLETED
        if (mpaBid.OrderItem.status === OrderItemStatus.ESCROW_COMPLETED
            && mpaBid.OrderItem.Order.status === OrderStatus.PROCESSING) {

            return await this.orderItemShipActionService.processMessage(marketplaceMessage, ActionDirection.INCOMING, smsgMessage)
                .then(() => SmsgMessageStatus.PROCESSED)
                .catch(() => SmsgMessageStatus.PROCESSING_FAILED);

        } else if (mpaBid.OrderItem.status === OrderItemStatus.COMPLETE
            && mpaBid.OrderItem.Order.status === OrderStatus.COMPLETE) {
            // the buyer released the escrow after the seller completed it and before the seller sent the MPA_SHIP
            // no need to do anything
            return SmsgMessageStatus.PROCESSED;
        } else {
            // escrow is not locked yet, send to waiting queue, until escrow gets locked
            return SmsgMessageStatus.WAITING;
        }
    }
}
