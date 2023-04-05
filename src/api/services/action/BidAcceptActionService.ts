// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as resources from 'resources';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../../core/Logger';
import { Core, Targets, Types } from '../../../constants';
import { EventEmitter } from 'events';
import { BidService } from '../model/BidService';
import { BidFactory } from '../../factories/model/BidFactory';
import { SmsgService } from '../SmsgService';
import { SmsgSendResponse } from '../../responses/SmsgSendResponse';
import { MarketplaceMessage } from '../../messages/MarketplaceMessage';
import { OrderService } from '../model/OrderService';
import { SmsgMessageService } from '../model/SmsgMessageService';
import { SmsgMessageFactory } from '../../factories/model/SmsgMessageFactory';
import { ListingItemAddActionService } from './ListingItemAddActionService';
import { OmpService } from '../OmpService';
import { BidCreateRequest } from '../../requests/model/BidCreateRequest';
import { BidAcceptRequest } from '../../requests/action/BidAcceptRequest';
import { BidAcceptValidator } from '../../messagevalidators/BidAcceptValidator';
import { BidAcceptMessage } from '../../messages/action/BidAcceptMessage';
import { OrderStatus } from '../../enums/OrderStatus';
import { OrderItemService } from '../model/OrderItemService';
import { OrderItemStatus } from '../../enums/OrderItemStatus';
import { MPAction } from '@zasmilingidiot/omp-lib/dist/interfaces/omp-enums';
import { NotifyService } from '../NotifyService';
import { ActionDirection } from '../../enums/ActionDirection';
import { MarketplaceNotification } from '../../messages/MarketplaceNotification';
import { BaseBidActionService } from '../BaseBidActionService';
import { ListingItemService } from '../model/ListingItemService';
import { BidAcceptMessageFactory } from '../../factories/message/BidAcceptMessageFactory';
import { BlacklistService } from '../model/BlacklistService';
import { MessageException } from '../../exceptions/MessageException';


export class BidAcceptActionService extends BaseBidActionService {

    /* eslint-disable max-params */
    constructor(
        @inject(Types.Service) @named(Targets.Service.SmsgService) public smsgService: SmsgService,
        @inject(Types.Service) @named(Targets.Service.OmpService) public ompService: OmpService,
        @inject(Types.Service) @named(Targets.Service.NotifyService) public notificationService: NotifyService,
        @inject(Types.Service) @named(Targets.Service.action.ListingItemAddActionService) public listingItemAddActionService: ListingItemAddActionService,
        @inject(Types.Service) @named(Targets.Service.model.SmsgMessageService) public smsgMessageService: SmsgMessageService,
        @inject(Types.Service) @named(Targets.Service.model.BidService) public bidService: BidService,
        @inject(Types.Service) @named(Targets.Service.model.ListingItemService) public listingItemService: ListingItemService,
        @inject(Types.Service) @named(Targets.Service.model.OrderService) public orderService: OrderService,
        @inject(Types.Service) @named(Targets.Service.model.OrderItemService) public orderItemService: OrderItemService,
        @inject(Types.Service) @named(Targets.Service.model.BlacklistService) public blacklistService: BlacklistService,
        @inject(Types.Factory) @named(Targets.Factory.model.SmsgMessageFactory) public smsgMessageFactory: SmsgMessageFactory,
        @inject(Types.Factory) @named(Targets.Factory.model.BidFactory) public bidFactory: BidFactory,
        @inject(Types.Factory) @named(Targets.Factory.message.BidAcceptMessageFactory) public actionMessageFactory: BidAcceptMessageFactory,
        @inject(Types.MessageValidator) @named(Targets.MessageValidator.BidAcceptValidator) public validator: BidAcceptValidator,
        @inject(Types.Core) @named(Core.Events) public eventEmitter: EventEmitter,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        super(
            MPAction.MPA_ACCEPT,
            smsgService,
            smsgMessageService,
            notificationService,
            blacklistService,
            smsgMessageFactory,
            validator,
            Logger,
            listingItemService,
            bidService,
            bidFactory
        );
    }
    /* eslint-enable max-params */

    /**
     * create the MarketplaceMessage to which is to be posted to the network
     *
     * - recreate ListingItemMessage with factory
     * - find the received BidMessage
     * - generate BidAcceptMessage with omp using recreated ListingItemMessage and previously stored BidMessage
     *
     * @param actionRequest
     */
    public async createMarketplaceMessage(actionRequest: BidAcceptRequest): Promise<MarketplaceMessage> {
        return await this.actionMessageFactory.get(actionRequest);
    }

    /**
     * called after createMessage and before post is executed and message is sent
     *
     * @param actionRequest
     * @param marketplaceMessage, omp generated MPA_ACCEPT
     */
    public async beforePost(actionRequest: BidAcceptRequest, marketplaceMessage: MarketplaceMessage): Promise<MarketplaceMessage> {
        return marketplaceMessage;
    }

    /**
     * called after post is executed and message is sent
     *
     * @param actionRequest
     * @param marketplaceMessage
     * @param smsgMessage
     * @param smsgSendResponse
     */
    public async afterPost(
        actionRequest: BidAcceptRequest,
        marketplaceMessage: MarketplaceMessage,
        smsgMessage: resources.SmsgMessage,
        smsgSendResponse: SmsgSendResponse
    ): Promise<SmsgSendResponse> {

        return smsgSendResponse;
    }

    /**
     *
     * - create the bidCreateRequest to save the Bid (MPA_ACCEPT) in the Database
     * - the previous Bid should be added as parentBid to create the relation
     * - call createBid to create the Bid and update Order and OrderItem statuses
     * - create the Bid (MPA_ACCEPT) (+BidDatas copied from parentBid), with previous Bid (MPA_BID) as the parentBid
     * - update OrderItem.status -> AWAITING_ESCROW
     * - update Order.status
     *
     * @param marketplaceMessage
     * @param actionDirection
     * @param smsgMessage
     * @param actionRequest
     */
    public async processMessage(
        marketplaceMessage: MarketplaceMessage,
        actionDirection: ActionDirection,
        smsgMessage: resources.SmsgMessage
        // actionRequest?: BidAcceptRequest
    ): Promise<resources.SmsgMessage> {

        const bidAcceptMessage: BidAcceptMessage = marketplaceMessage.action as BidAcceptMessage;
        const bidCreateRequest: BidCreateRequest = await this.createChildBidCreateRequest(bidAcceptMessage, smsgMessage);

        // TODO: currently we support just one OrderItem per Order
        await this.bidService.create(bidCreateRequest)
            .then(async value => {
                const bid: resources.Bid = value.toJSON();
                // this.log.debug('processMessage(), bid: ', JSON.stringify(bid, null, 2));

                const nextOrderStatus = OrderItemStatus.AWAITING_ESCROW;

                const isValid = bid.ParentBid.OrderItem.status && this.orderItemService.isNextStatusValid(
                    bid.ParentBid.OrderItem.status,
                    nextOrderStatus
                );

                if (!isValid) {
                    throw new MessageException(
                        `Invalid orderitem sequence for orderitem id ${bid.ParentBid.OrderItem.id}: ${bid.ParentBid.OrderItem.status} -> ${nextOrderStatus}`
                    );
                }

                await this.orderItemService.updateStatus(bid.ParentBid.OrderItem.id, nextOrderStatus);
                await this.orderService.updateStatus(bid.ParentBid.OrderItem.Order.id, OrderStatus.PROCESSING);

                return await this.bidService.findOne(bid.id, true).then(bidModel => bidModel.toJSON());
            });

        return smsgMessage;
    }

    /**
     *
     * @param marketplaceMessage
     * @param actionDirection
     * @param smsgMessage
     */
    public async createNotification(
        marketplaceMessage: MarketplaceMessage,
        actionDirection: ActionDirection,
        smsgMessage: resources.SmsgMessage
    ): Promise<MarketplaceNotification | undefined> {

        // only send notifications when receiving messages
        if (ActionDirection.INCOMING === actionDirection) {
            return this.createBidNotification(marketplaceMessage, smsgMessage);
        }
        return undefined;
    }

}
