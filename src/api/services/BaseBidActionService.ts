// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import * as resources from 'resources';
import { SmsgService } from './SmsgService';
import { SmsgMessageService } from './model/SmsgMessageService';
import { SmsgMessageFactory } from '../factories/model/SmsgMessageFactory';
import { BidCreateParams } from '../factories/ModelCreateParams';
import { Logger as LoggerType } from '../../core/Logger';
import { ActionMessageValidatorInterface } from '../messagevalidators/ActionMessageValidatorInterface';
import { NotifyService } from './NotifyService';
import { ActionMessageTypes } from '../enums/ActionMessageTypes';
import { ActionMessageObjects } from './../enums/ActionMessageObjects';
import { KVS } from 'omp-lib/dist/interfaces/common';
import { BaseActionService } from './BaseActionService';
import { BidCreateRequest } from '../requests/model/BidCreateRequest';
import { ListingItemService } from './model/ListingItemService';
import { BidFactory } from '../factories/model/BidFactory';
import { BidService } from './model/BidService';
import { BidAcceptMessage } from '../messages/action/BidAcceptMessage';
import { BidCancelMessage } from '../messages/action/BidCancelMessage';
import { BidRejectMessage } from '../messages/action/BidRejectMessage';
import { OrderItemShipMessage } from '../messages/action/OrderItemShipMessage';
import { EscrowCompleteMessage } from '../messages/action/EscrowCompleteMessage';
import { EscrowLockMessage } from '../messages/action/EscrowLockMessage';
import { EscrowRefundMessage } from '../messages/action/EscrowRefundMessage';
import { EscrowReleaseMessage } from '../messages/action/EscrowReleaseMessage';
import { MarketplaceMessage } from '../messages/MarketplaceMessage';
import { MarketplaceNotification } from '../messages/MarketplaceNotification';
import { BidNotification } from '../messages/notification/BidNotification';
import { unmanaged } from 'inversify';
import { BlacklistService } from './model/BlacklistService';


export type ChildBidActionMessages = BidAcceptMessage | BidCancelMessage | BidRejectMessage | OrderItemShipMessage
    | EscrowCompleteMessage | EscrowLockMessage | EscrowRefundMessage | EscrowReleaseMessage;

export abstract class BaseBidActionService extends BaseActionService {

    public listingItemService: ListingItemService;
    public bidService: BidService;
    public bidFactory: BidFactory;

    // tslint:disable:parameters-max-number
    constructor(@unmanaged() eventType: ActionMessageTypes,
                @unmanaged() smsgService: SmsgService,
                @unmanaged() smsgMessageService: SmsgMessageService,
                @unmanaged() notificationService: NotifyService,
                @unmanaged() blacklistService: BlacklistService,
                @unmanaged() smsgMessageFactory: SmsgMessageFactory,
                @unmanaged() validator: ActionMessageValidatorInterface,
                @unmanaged() Logger: typeof LoggerType,
                @unmanaged() listingItemService: ListingItemService,
                @unmanaged() bidService: BidService,
                @unmanaged() bidFactory: BidFactory) {
        super(
            eventType,
            smsgService,
            smsgMessageService,
            notificationService,
            blacklistService,
            smsgMessageFactory,
            validator,
            Logger
        );
        // tslint:enable:parameters-max-number

        this.listingItemService = listingItemService;
        this.bidService = bidService;
        this.bidFactory = bidFactory;
    }

    public async createChildBidCreateRequest(actionMessage: ChildBidActionMessages, smsgMessage: resources.SmsgMessage): Promise<BidCreateRequest> {

        // - first get the previous Bid (MPA_BID), fail if it doesn't exist
        // - then get the ListingItem the Bid is for, fail if it doesn't exist
        // - create and return BidCreateRequest

        const mpaBid: resources.Bid = await this.bidService.findOneByHash(actionMessage.bid).then(value => value.toJSON());
        const listingItem: resources.ListingItem = await this.listingItemService.findOne(mpaBid.ListingItem.id).then(value => value.toJSON());

        const bidCreateParams = {
            actionMessage,
            smsgMessage,
            listingItem,
            identity: mpaBid.Identity,
            bidder: mpaBid.bidder,
            parentBid: mpaBid
        } as BidCreateParams;

        return await this.bidFactory.get(bidCreateParams);
    }

    public async createBidNotification(marketplaceMessage: MarketplaceMessage,
                                       smsgMessage: resources.SmsgMessage): Promise<MarketplaceNotification | undefined> {

        const bid: resources.Bid = await this.bidService.findOneByMsgId(smsgMessage.msgid)
            .then(value => value.toJSON());

        if (bid) {
            const orderHash = _.find(Array.isArray(bid.BidDatas) ? bid.BidDatas : [], (kvs: KVS) => {
                return kvs.key === ActionMessageObjects.ORDER_HASH;
            });

            return {
                event: marketplaceMessage.action.type,
                payload: {
                    objectId: bid.id,
                    objectHash: bid.hash,
                    orderHash: orderHash ? orderHash.value : '',
                    from: smsgMessage.from,
                    to: smsgMessage.to,
                    target: bid.ListingItem.hash,
                    market: bid.ListingItem.market
                } as BidNotification
            } as MarketplaceNotification;
        }
        return undefined;
    }
}
