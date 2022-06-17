// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as resources from 'resources';
import * as Bookshelf from 'bookshelf';
import * as _ from 'lodash';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { validate, request } from '../../../core/api/Validate';
import { NotFoundException } from '../../exceptions/NotFoundException';
import { ValidationException } from '../../exceptions/ValidationException';
import { BidRepository } from '../../repositories/BidRepository';
import { Bid } from '../../models/Bid';
import { BidCreateRequest } from '../../requests/model/BidCreateRequest';
import { BidUpdateRequest } from '../../requests/model/BidUpdateRequest';
import { BidDataCreateRequest } from '../../requests/model/BidDataCreateRequest';
import { BidSearchParams } from '../../requests/search/BidSearchParams';
import { EventEmitter } from 'events';
import { BidDataService } from './BidDataService';
import { ListingItemService } from './ListingItemService';
import { AddressService } from './AddressService';
import { ProfileService } from './ProfileService';
import { SearchOrder } from '../../enums/SearchOrder';
import { MPAction } from '@zasmilingidiot/omp-lib/dist/interfaces/omp-enums';
import { MessageException } from '../../exceptions/MessageException';
import { CoreRpcService } from '../CoreRpcService';
import { MarketplaceMessage } from '../../messages/MarketplaceMessage';
import { SmsgMessageService } from './SmsgMessageService';
import { IdentityService } from './IdentityService';

export class BidService {

    public log: LoggerType;

    constructor(
        @inject(Types.Repository) @named(Targets.Repository.BidRepository) public bidRepo: BidRepository,
        @inject(Types.Service) @named(Targets.Service.model.BidDataService) public bidDataService: BidDataService,
        @inject(Types.Service) @named(Targets.Service.model.ListingItemService) public listingItemService: ListingItemService,
        @inject(Types.Service) @named(Targets.Service.model.AddressService) public addressService: AddressService,
        @inject(Types.Service) @named(Targets.Service.model.ProfileService) public profileService: ProfileService,
        @inject(Types.Service) @named(Targets.Service.model.IdentityService) public identityService: IdentityService,
        @inject(Types.Service) @named(Targets.Service.model.SmsgMessageService) public smsgMessageService: SmsgMessageService,
        @inject(Types.Service) @named(Targets.Service.CoreRpcService) public coreRpcService: CoreRpcService,
        @inject(Types.Core) @named(Core.Events) public eventEmitter: EventEmitter,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    public async findAll(): Promise<Bookshelf.Collection<Bid>> {
        return await this.bidRepo.findAll();
    }

    public async findAllByProfileId(id: number, withRelated: boolean = true): Promise<Bookshelf.Collection<Bid>> {
        return await this.bidRepo.findAllByProfileId(id, withRelated);
    }

    public async findAllByIdentityId(id: number, withRelated: boolean = true): Promise<Bookshelf.Collection<Bid>> {
        return await this.bidRepo.findAllByIdentityId(id, withRelated);
    }

    public async findOne(id: number, withRelated: boolean = true): Promise<Bid> {
        const bid = await this.bidRepo.findOne(id, withRelated);
        if (bid === null) {
            this.log.warn(`Bid with the id=${id} was not found!`);
            throw new NotFoundException(id);
        }
        return bid;
    }

    public async findOneByHash(hash: string, withRelated: boolean = true): Promise<Bid> {
        const bid = await this.bidRepo.findOneByHash(hash, withRelated);
        if (bid === null) {
            this.log.warn(`Bid with the hash=${hash} was not found!`);
            throw new NotFoundException(hash);
        }
        return bid;
    }

    public async findOneByMsgId(msgId: string, withRelated: boolean = true): Promise<Bid> {
        const smsgMessage = await this.bidRepo.findOneByMsgId(msgId, withRelated);
        if (smsgMessage === null) {
            this.log.warn(`SmsgMessage with the msgid=${msgId} was not found!`);
            throw new NotFoundException(msgId);
        }
        return smsgMessage;
    }

    public async unlockBidOutputs(cancelBid: resources.Bid): Promise<void> {

        // if identity is found for cancelBid.ParentBid.bidder, then we're the bidder
        let identity: resources.Identity = await this.identityService.findOneByAddress(cancelBid.ParentBid.bidder)
            .then(value => value.toJSON())
            .catch(() => undefined);

        if (identity) {
            await this.unlockOutputsFor(identity.wallet, cancelBid.ParentBid.msgid, 'buyer');
        } else {
            const parentBid = await this.findOne(cancelBid.ParentBid.id, true).then(b => b.toJSON());
            const mpaAcceptBid: resources.Bid | undefined = _.find(parentBid.ChildBids, (child) => child.type === MPAction.MPA_ACCEPT);
            if (mpaAcceptBid) {
                // we're the seller
                identity = await this.identityService.findOneByAddress(cancelBid.ListingItem.seller).then(value => value.toJSON());
                await this.unlockOutputsFor(identity.wallet, mpaAcceptBid.msgid, 'seller');
            }
        }
    }

    /**
     * search Bids using given BidSearchParams
     *
     * @param options
     * @param withRelated
     * @returns {Promise<Bookshelf.Collection<Bid>>}
     */
    @validate()
    public async search(@request(BidSearchParams) options: BidSearchParams, withRelated: boolean = true): Promise<Bookshelf.Collection<Bid>> {
        // this.log.debug('search(), options: ', JSON.stringify(options, null, 2));
        return await this.bidRepo.search(options, withRelated);
    }

    @validate()
    public async getLatestBidByBidder(listingItemId: number, bidder: string): Promise<Bid> {
        // return await this.bidRepo.getLatestBid(listingItemId, bidder);
        return await this.search({
            listingItemId,
            bidders: [ bidder ],
            order: SearchOrder.DESC
        } as BidSearchParams, true)[0];
    }

    @validate()
    public async create(@request(BidCreateRequest) data: BidCreateRequest): Promise<Bid> {

        let body: BidCreateRequest | Partial<BidCreateRequest> = JSON.parse(JSON.stringify(data));
        // this.log.debug('BidCreateRequest:', JSON.stringify(body, null, 2));

        // MPAction.MPA_BID needs to contain shipping address, for other types its optional
        if (body.type === MPAction.MPA_BID) {
            if (_.isEmpty(body.address) && _.isEmpty(body.address_id)) {
                this.log.error('Request body is not valid, address missing');
                throw new ValidationException('Request body is not valid', ['address missing']);
            } else { // if (!body.address_id) {
                // no address_id -> create one
                // NOTE: in both cases, there should not be address_id set, as we want to create a new delivery address for each new bid

                const addressCreateRequest = body.address;
                body = _.omit(body, 'address');

                // no profile_id set -> figure it out
                if (addressCreateRequest && !addressCreateRequest.profile_id) {

                    // todo: now when there's a relation to Profile, this is propably not necessary anymore
                    // ...or could be moved to where BidCreateRequest is created

                    // if identity is found for body.bidder, then we're the bidder
                    const identity: resources.Identity = await this.identityService.findOneByAddress(body.bidder!)
                        .then(value => value.toJSON())
                        .catch(() => undefined);

                    if (identity) {
                        addressCreateRequest.profile_id = identity.Profile.id;
                    } else {
                        // local identity wasn't the bidder, so we must be the seller, fetch the Profile through the ListingItem
                        addressCreateRequest.profile_id = await this.listingItemService.findOne(body.listing_item_id!)
                            .then(value => {
                                const listingItem: resources.ListingItem = value.toJSON();
                                return listingItem.ListingItemTemplate.Profile.id;
                            })
                            .catch(() => {
                                this.log.error('Bid doesnt belong to any local Profile');
                                throw new MessageException('Bid doesnt belong to any local Profile');
                            });
                    }
                }

                // this.log.debug('address create request: ', JSON.stringify(addressCreateRequest, null, 2));
                const address: resources.Address = await this.addressService.create(addressCreateRequest!)
                    .then(value => value.toJSON());
                // this.log.debug('created address: ', JSON.stringify(address, null, 2));

                // set the address_id for the bid
                body.address_id = address.id;
            }

        } else {
            // Bid.type !== MPAction.MPA_BID needs to have a parent_bid_id
            if (!body.parent_bid_id) {
                this.log.error('Request body is not valid, parent_bid_id missing');
                throw new ValidationException('Request body is not valid', ['parent_bid_id missing']);
            }
        }

        const bidDatas = body.bidDatas || [];
        body = _.omit(body, 'bidDatas');

        const bid: resources.Bid = await this.bidRepo.create(body).then(value => value.toJSON());

        for (const dataToSave of bidDatas) {
            dataToSave.bid_id = bid.id;
            await this.bidDataService.create(dataToSave);
        }

        return await this.findOne(bid.id, true);
    }

    @validate()
    public async update(id: number, @request(BidUpdateRequest) data: BidUpdateRequest): Promise<Bid> {

        const body: Partial<BidUpdateRequest> = JSON.parse(JSON.stringify(data));

        // find the existing one without related
        const bid = await this.findOne(id, false);

        // extract and remove related models from request
        const bidDatas: BidDataCreateRequest[] = body.bidDatas || [];
        delete body.bidDatas;

        // set new values, we only need to change the type
        bid.Type = body.type as string;
        bid.Hash = body.hash as string;
        bid.GeneratedAt = body.generatedAt as number;

        // TODO: not sure if we should even allow updating the related bidDatas
        // update bid record
        const updatedBid = await this.bidRepo.update(id, bid.toJSON());

        // remove old BidDatas
        if (bidDatas) {
            const oldBidDatas = updatedBid.related('BidDatas').toJSON();
            for (const bidData of oldBidDatas) {
                await this.bidDataService.destroy(bidData.id);
            }

            // create new BidDatas
            for (const bidData of bidDatas) {
                bidData.bid_id = id;
                await this.bidDataService.create(bidData);
            }
        }

        return await this.findOne(id, true);
    }

    public async destroy(id: number): Promise<void> {
        await this.bidRepo.destroy(id);
    }

    private async unlockOutputsFor(wallet: string, msgid: string, type: string): Promise<void>  {
        const bidSmsgMessage: resources.SmsgMessage = await this.smsgMessageService.findOneByMsgIdAndDirection(msgid).then((b) => b.toJSON());
        const bidMPM: MarketplaceMessage = JSON.parse(bidSmsgMessage.text);
        await this.coreRpcService.lockUnspent(wallet, true, bidMPM.action[type].payment.prevouts, true);
    }

}
