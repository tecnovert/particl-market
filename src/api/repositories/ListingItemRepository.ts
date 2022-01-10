// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Bookshelf from 'bookshelf';
import { inject, named } from 'inversify';
import { Types, Core, Targets } from '../../constants';
import { ListingItem } from '../models/ListingItem';
import { DatabaseException } from '../exceptions/DatabaseException';
import { NotFoundException } from '../exceptions/NotFoundException';
import { Logger as LoggerType } from '../../core/Logger';
import { ListingItemSearchParams } from '../requests/search/ListingItemSearchParams';

export class ListingItemRepository {

    public log: LoggerType;

    constructor(
        @inject(Types.Model) @named(Targets.Model.ListingItem) public ListingItemModel: typeof ListingItem,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    public async findAll(): Promise<Bookshelf.Collection<ListingItem>> {
        const list = await this.ListingItemModel.fetchAll<ListingItem>();
        return list;
    }
/*
    public async findAllByCategory(categoryId: number, withRelated: boolean = true): Promise<Bookshelf.Collection<ListingItem>> {
        return await this.ListingItemModel.fetchAllByCategory(categoryId, withRelated);
    }
*/
    public async findAllExpired(): Promise<Bookshelf.Collection<ListingItem>> {
        return this.ListingItemModel.fetchAllExpired();
    }

    /**
     *
     * @param {string} hash
     * @param {boolean} withRelated
     * @returns {Promise<ListingItem>}
     */
    public async findAllByHash(hash: string, withRelated: boolean = true): Promise<Bookshelf.Collection<ListingItem>> {
        return this.ListingItemModel.fetchAllByHash(hash, withRelated);
    }

    public async findAllByHashAndMarketReceiveAddress(
        hash: string, marketReceiveAddress: string, withRelated: boolean = true
    ): Promise<Bookshelf.Collection<ListingItem>> {
        return this.ListingItemModel.fetchAllByHashAndMarketReceiveAddress(hash, marketReceiveAddress, withRelated);
    }

    public async findOne(id: number, withRelated: boolean = true): Promise<ListingItem> {
        return this.ListingItemModel.fetchById(id, withRelated);
    }

    public async findOneByMsgId(msgId: string, withRelated: boolean = true): Promise<ListingItem> {
        return this.ListingItemModel.fetchByMsgId(msgId, withRelated);
    }

    public async findOneByHashAndMarketReceiveAddress(hash: string, marketReceiveAddress: string, withRelated: boolean = true): Promise<ListingItem> {
        return this.ListingItemModel.fetchByHashAndMarketReceiveAddress(hash, marketReceiveAddress, withRelated);
    }

    /**
     *
     * @param {ListingItemSearchParams} options
     * @param {boolean} withRelated
     * @returns {Promise<Bookshelf.Collection<ListingItem>>}
     */
    public async search(options: ListingItemSearchParams, withRelated: boolean): Promise<Bookshelf.Collection<ListingItem>> {
        return this.ListingItemModel.searchBy(options, withRelated);
    }

    public async create(data: any): Promise<ListingItem> {
        const listingItem = this.ListingItemModel.forge<ListingItem>(data);
        try {
            const listingItemCreated = await listingItem.save();
            const result = this.ListingItemModel.fetchById(listingItemCreated.id);
            return result;
        } catch (error) {
            this.log.error(error);
            throw new DatabaseException('Could not create the listingItem!', error);
        }
    }

    public async update(id: number, data: any): Promise<ListingItem> {
        const listingItem = this.ListingItemModel.forge<ListingItem>({ id });
        try {
            const listingItemUpdated = await listingItem.save(data, { patch: true });
            return this.ListingItemModel.fetchById(listingItemUpdated.id);
        } catch (error) {
            this.log.error(error);
            throw new DatabaseException('Could not update the listingItem!', error);
        }
    }

    public async destroy(id: number): Promise<void> {
        let listingItem = this.ListingItemModel.forge<ListingItem>({ id });
        try {
            listingItem = await listingItem.fetch({ require: true });
        } catch (error) {
            this.log.error(error);
            throw new NotFoundException(id);
        }

        try {
            await listingItem.destroy();
            return;
        } catch (error) {
            this.log.error(error);
            throw new DatabaseException('Could not delete the listingItem!', error);
        }
    }

}
