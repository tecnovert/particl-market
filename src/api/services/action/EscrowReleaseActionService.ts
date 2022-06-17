// Copyright (c) 2017-2022, The Particl Market developers
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
import { ListingItemService } from '../model/ListingItemService';
import { SmsgSendResponse } from '../../responses/SmsgSendResponse';
import { MarketplaceMessage } from '../../messages/MarketplaceMessage';
import { OrderService } from '../model/OrderService';
import { SmsgMessageService } from '../model/SmsgMessageService';
import { SmsgMessageFactory } from '../../factories/model/SmsgMessageFactory';
import { ListingItemAddActionService } from './ListingItemAddActionService';
import { OmpService } from '../OmpService';
import { OrderStatus } from '../../enums/OrderStatus';
import { OrderItemService } from '../model/OrderItemService';
import { OrderItemStatus } from '../../enums/OrderItemStatus';
import { BidCreateRequest } from '../../requests/model/BidCreateRequest';
import { CoreRpcService } from '../CoreRpcService';
import { EscrowReleaseRequest } from '../../requests/action/EscrowReleaseRequest';
import { EscrowReleaseMessage } from '../../messages/action/EscrowReleaseMessage';
import { EscrowReleaseMessageFactory } from '../../factories/message/EscrowReleaseMessageFactory';
import { EscrowReleaseValidator } from '../../messagevalidators/EscrowReleaseValidator';
import { KVS } from '@zasmilingidiot/omp-lib/dist/interfaces/common';
import { ActionMessageObjects } from '../../enums/ActionMessageObjects';
import { MPActionExtended } from '../../enums/MPActionExtended';
import { BaseBidActionService } from '../BaseBidActionService';
import { NotifyService } from '../NotifyService';
import { ActionDirection } from '../../enums/ActionDirection';
import { MarketplaceNotification } from '../../messages/MarketplaceNotification';
import { BlacklistService } from '../model/BlacklistService';
import { MessageException } from '../../exceptions/MessageException';


export class EscrowReleaseActionService extends BaseBidActionService {

    /* eslint-disable max-params */
    constructor(
        @inject(Types.Service) @named(Targets.Service.SmsgService) public smsgService: SmsgService,
        @inject(Types.Service) @named(Targets.Service.OmpService) public ompService: OmpService,
        @inject(Types.Service) @named(Targets.Service.NotifyService) public notificationService: NotifyService,
        @inject(Types.Service) @named(Targets.Service.action.ListingItemAddActionService) public listingItemAddActionService: ListingItemAddActionService,
        @inject(Types.Service) @named(Targets.Service.model.SmsgMessageService) public smsgMessageService: SmsgMessageService,
        @inject(Types.Factory) @named(Targets.Factory.model.SmsgMessageFactory) public smsgMessageFactory: SmsgMessageFactory,
        @inject(Types.Service) @named(Targets.Service.model.ListingItemService) public listingItemService: ListingItemService,
        @inject(Types.Service) @named(Targets.Service.model.BidService) public bidService: BidService,
        @inject(Types.Service) @named(Targets.Service.model.OrderService) public orderService: OrderService,
        @inject(Types.Service) @named(Targets.Service.model.OrderItemService) public orderItemService: OrderItemService,
        @inject(Types.Service) @named(Targets.Service.model.BlacklistService) public blacklistService: BlacklistService,
        @inject(Types.Factory) @named(Targets.Factory.model.BidFactory) public bidFactory: BidFactory,
        @inject(Types.Factory) @named(Targets.Factory.message.EscrowReleaseMessageFactory) public actionMessageFactory: EscrowReleaseMessageFactory,
        @inject(Types.Service) @named(Targets.Service.CoreRpcService) public coreRpcService: CoreRpcService,
        @inject(Types.MessageValidator) @named(Targets.MessageValidator.EscrowReleaseValidator) public validator: EscrowReleaseValidator,
        @inject(Types.Core) @named(Core.Events) public eventEmitter: EventEmitter,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        super(MPActionExtended.MPA_RELEASE,
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
     * - find the posted BidMessage
     * - find the received BidAcceptMessage
     * - generate the releasetx using omp
     * - post the releasetx
     * - generate EscrowReleaseMessage and pass the releasetxid forward to inform the seller
     *
     * @param actionRequest
     */
    public async createMarketplaceMessage(actionRequest: EscrowReleaseRequest): Promise<MarketplaceMessage> {
        return await this.actionMessageFactory.get(actionRequest);
    }

    /**
     * called after createMessage and before post is executed and message is sent
     *
     * - get the releasetx generated using omp-lib from the actionMessage (the temp _values will be removed automatically before message is sent)
     * - store the txid in the actionMessage
     * - and then send the rawtx
     *
     * @param actionRequest
     * @param marketplaceMessage, MPA_RELEASE
     */
    public async beforePost(actionRequest: EscrowReleaseRequest, marketplaceMessage: MarketplaceMessage): Promise<MarketplaceMessage> {

        // send the release rawtx
        const releasetx = marketplaceMessage.action['_releasetx'];
        const txid = await this.coreRpcService.sendRawTransaction(releasetx);
        delete marketplaceMessage.action['_releasetx'];

        // add txid to the EscrowReleaseMessage to be sent to the seller
        marketplaceMessage.action.objects = marketplaceMessage.action.objects ? marketplaceMessage.action.objects : [] as KVS[];
        marketplaceMessage.action.objects.push({
            key: ActionMessageObjects.TXID_RELEASE,
            value: txid
        } as KVS);

        return marketplaceMessage;
    }

    /**
     * called after post is executed and message is sent
     *
     * - create the bidCreateRequest to save the Bid (MPA_RELEASE) in the Database
     * - the previous Bid should be added as parentBid to create the relation
     * - call createBid to create the Bid and update Order and OrderItem statuses
     *
     * @param actionRequest
     * @param marketplaceMessage
     * @param smsgMessage
     * @param smsgSendResponse
     */
    public async afterPost(
        actionRequest: EscrowReleaseRequest,
        marketplaceMessage: MarketplaceMessage,
        smsgMessage: resources.SmsgMessage,
        smsgSendResponse: SmsgSendResponse
    ): Promise<SmsgSendResponse> {

        return smsgSendResponse;
    }

    /**
     * - create the Bid (MPA_RELEASE) (+BidDatas copied from parentBid), with previous Bid (MPA_BID) as the parentBid
     * - update OrderItem.status
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
        // actionRequest?: EscrowReleaseRequest
    ): Promise<resources.SmsgMessage> {

        const escrowReleaseMessage: EscrowReleaseMessage = marketplaceMessage.action as EscrowReleaseMessage;
        const bidCreateRequest: BidCreateRequest = await this.createChildBidCreateRequest(escrowReleaseMessage, smsgMessage);

        await this.bidService.create(bidCreateRequest)
            .then(async value => {
                const bid: resources.Bid = value.toJSON();

                const nextOrderStatus = OrderItemStatus.COMPLETE;

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
                await this.orderService.updateStatus(bid.ParentBid.OrderItem.Order.id, OrderStatus.COMPLETE);

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
