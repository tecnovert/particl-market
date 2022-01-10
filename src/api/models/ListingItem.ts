// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import { Bookshelf } from '../../config/Database';
import { Collection, Model } from 'bookshelf';
import { Logger as LoggerType } from '../../core/Logger';
import { ItemInformation } from './ItemInformation';
import { PaymentInformation } from './PaymentInformation';
import { MessagingInformation } from './MessagingInformation';
import { ListingItemObject } from './ListingItemObject';
import { ListingItemSearchParams } from '../requests/search/ListingItemSearchParams';
import { FavoriteItem } from './FavoriteItem';
import { ListingItemTemplate } from './ListingItemTemplate';
import { Bid } from './Bid';
import { FlaggedItem } from './FlaggedItem';
import { ShoppingCartItem } from './ShoppingCartItem';
import { SearchOrder } from '../enums/SearchOrder';
import { ListingItemSearchOrderField } from '../enums/SearchOrderField';
import { Blacklist } from './Blacklist';

export class ListingItem extends Bookshelf.Model<ListingItem> {

    public static log: LoggerType = new LoggerType(__filename);

    public static RELATIONS = [
        'ItemInformation',
        'ItemInformation.ItemCategory',
        'ItemInformation.ItemCategory.ParentItemCategory',
        'ItemInformation.ItemCategory.ParentItemCategory.ParentItemCategory',
        'ItemInformation.ItemCategory.ParentItemCategory.ParentItemCategory.ParentItemCategory',
        'ItemInformation.ItemCategory.ParentItemCategory.ParentItemCategory.ParentItemCategory.ParentItemCategory',
        'ItemInformation.ItemLocation',
        'ItemInformation.ItemLocation.LocationMarker',
        'ItemInformation.Images',
        'ItemInformation.Images.ImageDatas',
        'ItemInformation.ShippingDestinations',
        'PaymentInformation',
        'PaymentInformation.Escrow',
        'PaymentInformation.Escrow.Ratio',
        'PaymentInformation.ItemPrice',
        'PaymentInformation.ItemPrice.ShippingPrice',
        'PaymentInformation.ItemPrice.CryptocurrencyAddress',
        'MessagingInformation',
        'ListingItemObjects',
        'ListingItemObjects.ListingItemObjectDatas',
        'ListingItemTemplate',
        'ListingItemTemplate.Profile',
        'Bids',
        'Bids.BidDatas',
        'Bids.OrderItem',
        'Bids.OrderItem.Order',
        'FavoriteItems',
        'FavoriteItems.Profile',
        'FlaggedItem',
        'FlaggedItem.Proposal',
        'FlaggedItem.Proposal.ProposalOptions',
        // 'FlaggedItem.Proposal.ProposalOptions.Votes'
        // 'FlaggedItem.Proposal.ProposalResults'
        'Blacklists'
    ];

    public static async fetchAllByHash(hash: string, withRelated: boolean = true): Promise<Collection<ListingItem>> {
        const ListingItemCollection = ListingItem.forge<Model<ListingItem>>()
            .query(qb => {
                qb.where('hash', '=', hash);
            })
            .orderBy('expiry_time', 'ASC');

        return ListingItemCollection.fetchAll(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public static async fetchAllByHashAndMarketReceiveAddress(
        hash: string, marketReceiveAddress: string, withRelated: boolean = true
    ): Promise<Collection<ListingItem>> {
        const ListingItemCollection = ListingItem.forge<Model<ListingItem>>()
            .query(qb => {
                qb.where('hash', '=', hash).andWhere('market', '=', marketReceiveAddress);
            })
            .orderBy('expiry_time', 'ASC');

        return ListingItemCollection.fetchAll(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public static async fetchById(value: number, withRelated: boolean = true): Promise<ListingItem> {
        return ListingItem.where<ListingItem>({ id: value }).fetch(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public static async fetchByMsgId(value: string, withRelated: boolean = true): Promise<ListingItem> {
        return ListingItem.where<ListingItem>({ msgid: value }).fetch(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public static async fetchByHashAndMarketReceiveAddress(hash: string, marketReceiveAddress: string, withRelated: boolean = true): Promise<ListingItem> {
        return ListingItem.where<ListingItem>({ hash, market: marketReceiveAddress }).fetch(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }
/*
    TODO: remove?
    public static async fetchAllByCategory(categoryId: number, withRelated: boolean = true): Promise<Collection<ListingItem>> {

        const listingCollection = ListingItem.forge<Model<ListingItem>>()
            .query(qb => {
                qb.innerJoin('item_informations', 'listing_items.id', 'item_informations.listing_item_id');
                qb.where('item_informations.item_category_id', '=', categoryId);
                // ignore expired items
                qb.andWhere('expired_at', '>', Date.now());
                qb.andWhere('item_informations.item_category_id', '>', 0);
            })
            .orderBy('item_informations.title', 'ASC');

        if (withRelated) {
            return await listingCollection.fetchAll({
                withRelated: this.RELATIONS
            });
        } else {
            return await listingCollection.fetchAll();
        }
    }
*/

    public static async fetchAllExpired(): Promise<Collection<ListingItem>> {
        const listingCollection = ListingItem.forge<Model<ListingItem>>()
            .query(qb => {
                qb.joinRaw(`LEFT JOIN (SELECT listing_item_id, COUNT(*) AS bid_totals FROM bids GROUP BY listing_item_id) bid_totals
                    ON bid_totals.listing_item_id = listing_items.id`);
                qb.joinRaw(`LEFT JOIN (
                        SELECT DISTINCT listing_item_id AS cart_item_id, COUNT(listing_item_id) AS cart_item_count
                        FROM shopping_cart_items
                        GROUP BY listing_item_id
                    ) cart_totals
                    ON cart_totals.cart_item_id = listing_items.id`);
                qb.where('expired_at', '<=', Date.now());
                qb.andWhereRaw('bid_totals.bid_totals IS NULL');
                qb.andWhereRaw('cart_totals.cart_item_count IS NULL');
                qb.groupBy('listing_items.id');
            });
        return listingCollection.fetchAll();
    }

    public static async searchBy(options: ListingItemSearchParams, withRelated: boolean = false): Promise<Collection<ListingItem>> {

        options.page = options.page || 0;
        options.pageLimit = options.pageLimit || 10;
        options.order = options.order || SearchOrder.ASC;
        options.orderField = options.orderField || ListingItemSearchOrderField.CREATED_AT;

        // ListingItem.log.debug('...searchBy by options: ', JSON.stringify(options, null, 2));

        const collection = ListingItem.forge<Model<ListingItem>>()
            .query(qb => {
                // ignore expired items
                qb.where('expired_at', '>', Date.now());

                // searchBy by listingItemHash
                if (options.listingItemHash && options.listingItemHash !== '*') {
                    // qb.innerJoin('listing_item_templates', 'listing_item_templates.id', 'listing_items.listing_item_template_id');
                    // qb.where('listing_item_templates.hash', '=', options.listingItemHash);

                    qb.andWhere('listing_items.hash', '=', options.listingItemHash);
                }

                if (options.msgid && options.msgid !== '*') {
                    qb.andWhere('listing_items.msgid', '=', options.msgid);
                }

                // searchBy by buyer
                let joinedBids = false;
                if (options.buyer && options.buyer !== '*') {
                    if (!joinedBids) {
                        qb.innerJoin('bids', 'bids.listing_item_id', 'listing_items.id');
                        joinedBids = true;
                    }
                    qb.andWhere('bids.bidder', '=', options.buyer);
                }

                // searchBy by seller
                if (options.seller && options.seller !== '*') {
                    qb.andWhere('listing_items.seller', '=', options.seller);
                }

                qb.innerJoin('item_informations', 'item_informations.listing_item_id', 'listing_items.id');

                // searchBy categories
                if (options.categories && options.categories.length > 0) {
                    if (typeof options.categories[0] === 'number') {
                        qb.innerJoin('item_categories', 'item_categories.id', 'item_informations.item_category_id');
                        qb.andWhere('item_categories.id', 'in', options.categories);
                    } else if (typeof options.categories[0] === 'string') {
                        qb.innerJoin('item_categories', 'item_categories.id', 'item_informations.item_category_id');
                        qb.andWhere('item_categories.key', 'in', options.categories);
                    }
                }

                /*
                if (options.category && typeof options.category === 'number') {
                    qb.innerJoin('item_categories', 'item_categories.id', 'item_informations.item_category_id');
                    qb.where('item_categories.id', '=', options.category);
                    ListingItem.log.debug('...searchBy by category.id: ', options.category);
                } else if (options.category && typeof options.category === 'string') {
                    qb.innerJoin('item_categories', 'item_categories.id', 'item_informations.item_category_id');
                    qb.where('item_categories.key', '=', options.category);
                    ListingItem.log.debug('...searchBy by category.key: ', options.category);
                }
                */

                // searchBy by profile
                /*
                if (typeof options.profileId === 'number') {
                    qb.innerJoin('listing_item_templates', 'listing_item_templates.id', 'listing_items.listing_item_template_id');
                    qb.where('listing_item_templates.profile_id', '=', options.profileId);
                    ListingItem.log.debug('...searchBy by profileId: ', options.profileId);

                } else if (options.profileId === 'OWN') { // ListingItems belonging to any profile
                    qb.innerJoin('listing_item_templates', 'listing_item_templates.id', 'listing_items.listing_item_template_id');
                }
                */

                // searchBy by item price
                if (options.minPrice !== undefined && options.minPrice >= 0 && options.maxPrice !== undefined && options.maxPrice >= 0) {
                    qb.innerJoin('payment_informations', 'payment_informations.listing_item_id', 'listing_items.id');
                    qb.innerJoin('item_prices', 'payment_informations.id', 'item_prices.payment_information_id');
                    qb.whereBetween('item_prices.base_price', [options.minPrice, options.maxPrice]);
                }

                // searchBy by item location (country)
                if (options.country) {
                    qb.innerJoin('item_locations', 'item_informations.id', 'item_locations.item_information_id');
                    qb.andWhere('item_locations.country', options.country);
                }

                // searchBy by shippingDestination
                if (options.shippingDestination) {
                    qb.leftJoin('shipping_destinations', 'item_informations.id', 'shipping_destinations.item_information_id');
                    qb.andWhere( qbInner => {
                       return qbInner.where( qbInnerInner => {
                           qbInnerInner.where('shipping_destinations.country', options.shippingDestination)
                               .andWhere('shipping_destinations.shipping_availability', 'SHIPS');
                       }).orWhereNull('shipping_destinations.country');
                    });
                }

                if (options.searchString) {
                    qb.andWhere(qbInner => {
                        return qbInner.where('item_informations.title', 'LIKE', '%' + options.searchString + '%')
                            .orWhere('item_informations.short_description', 'LIKE', '%' + options.searchString + '%')
                            .orWhere('item_informations.long_description', 'LIKE', '%' + options.searchString + '%')
                            .orWhere('listing_items.hash', '=', options.searchString);
                    });
                }

                if (options.flagged) {
                    // ListingItems having FlaggedItem
                    qb.innerJoin('flagged_items', 'listing_items.id', 'flagged_items.listing_item_id');
                } else {
                    qb.andWhere('listing_items.removed', '=', false);
                }

                if (options.market) {
                    qb.andWhere('listing_items.market', '=', options.market);
                }

                if (options.withBids && !joinedBids) { // Don't want to join twice or we'll get errors.
                    qb.innerJoin('bids', 'bids.listing_item_id', 'listing_items.id');
                }
                // qb.groupBy('listing_items.id');

            })
            .orderBy(options.orderField, options.order)
            .query({
                limit: options.pageLimit,
                offset: options.page * options.pageLimit
            });

        return collection.fetchAll(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }


    public get tableName(): string { return 'listing_items'; }
    public get hasTimestamps(): boolean { return true; }

    public get Id(): number { return this.get('id'); }
    public set Id(value: number) { this.set('id', value); }

    public get Msgid(): string { return this.get('msgid'); }
    public set Msgid(value: string) { this.set('msgid', value); }

    public get Hash(): string { return this.get('hash'); }
    public set Hash(value: string) { this.set('hash', value); }

    public get Removed(): boolean { return this.get('removed'); }
    public set Removed(value: boolean) { this.set('removed', value); }

    public get Seller(): string { return this.get('seller'); }
    public set Seller(value: string) { this.set('seller', value); }

    public get Signature(): string { return this.get('signature'); }
    public set Signature(value: string) { this.set('signature', value); }

    public get Market(): string { return this.get('market'); }
    public set Market(value: string) { this.set('market', value); }

    public get ExpiryTime(): number { return this.get('expiryTime'); }
    public set ExpiryTime(value: number) { this.set('expiryTime', value); }

    public get PostedAt(): number { return this.get('postedAt'); }
    public set PostedAt(value: number) { this.set('postedAt', value); }

    public get ExpiredAt(): number { return this.get('expiredAt'); }
    public set ExpiredAt(value: number) { this.set('expiredAt', value); }

    public get ReceivedAt(): number { return this.get('receivedAt'); }
    public set ReceivedAt(value: number) { this.set('receivedAt', value); }

    public get GeneratedAt(): number { return this.get('generatedAt'); }
    public set GeneratedAt(value: number) { this.set('generatedAt', value); }

    public get UpdatedAt(): Date { return this.get('updatedAt'); }
    public set UpdatedAt(value: Date) { this.set('updatedAt', value); }

    public get CreatedAt(): Date { return this.get('createdAt'); }
    public set CreatedAt(value: Date) { this.set('createdAt', value); }

    public ItemInformation(): ItemInformation {
        return this.hasOne(ItemInformation);
    }

    public PaymentInformation(): PaymentInformation {
        return this.hasOne(PaymentInformation);
    }

    public MessagingInformation(): Collection<MessagingInformation> {
        return this.hasMany(MessagingInformation, 'listing_item_id', 'id');
    }

    public ListingItemObjects(): Collection<ListingItemObject> {
        return this.hasMany(ListingItemObject, 'listing_item_id', 'id');
    }

    public FavoriteItems(): Collection<FavoriteItem> {
        return this.hasMany(FavoriteItem, 'listing_item_id', 'id');
    }

    public ListingItemTemplate(): ListingItemTemplate {
        return this.belongsTo(ListingItemTemplate, 'listing_item_template_id', 'id');
    }

    public Bids(): Collection<Bid> {
        return this.hasMany(Bid, 'listing_item_id', 'id');
    }

    public FlaggedItem(): FlaggedItem {
        return this.hasOne(FlaggedItem);
    }

    // todo: ShoppingCartItems
    public ShoppingCartItem(): Collection<ShoppingCartItem> {
        return this.hasMany(ShoppingCartItem, 'listing_item_id', 'id');
    }

    public Blacklists(): Collection<Blacklist> {
        return this.hasMany(Blacklist, 'listing_item_id', 'id');
    }

}
