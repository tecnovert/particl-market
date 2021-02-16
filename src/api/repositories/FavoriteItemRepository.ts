// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Bookshelf from 'bookshelf';
import { inject, named } from 'inversify';
import { Types, Core, Targets } from '../../constants';
import { FavoriteItem } from '../models/FavoriteItem';
import { DatabaseException } from '../exceptions/DatabaseException';
import { NotFoundException } from '../exceptions/NotFoundException';
import { Logger as LoggerType } from '../../core/Logger';

export class FavoriteItemRepository {

    public log: LoggerType;

    constructor(
        @inject(Types.Model) @named(Targets.Model.FavoriteItem) public FavoriteItemModel: typeof FavoriteItem,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    public async findAll(): Promise<Bookshelf.Collection<FavoriteItem>> {
        const list = await this.FavoriteItemModel.fetchAll();
        return list as Bookshelf.Collection<FavoriteItem>;
    }

    public async findOne(id: number, withRelated: boolean = true): Promise<FavoriteItem> {
        return await this.FavoriteItemModel.fetchById(id, withRelated);
    }

    /**
     * searchBy favorite item by profile id and item id
     *
     * @param {number} profileId
     * @param {number} itemId
     * @param {boolean} withRelated
     * @returns {Promise<FavoriteItem>}
     */
    public async findOneByProfileIdAndListingItemId(profileId: number, itemId: number, withRelated: boolean = true): Promise<FavoriteItem> {
        return await this.FavoriteItemModel.fetchByProfileIdAndListingItemId(profileId, itemId, withRelated);
    }

    public async findAllByProfileId(profileId: number, withRelated: boolean): Promise<Bookshelf.Collection<FavoriteItem>> {
        return await this.FavoriteItemModel.fetchFavoritesByProfileId(profileId, withRelated);
    }

    public async create(data: any): Promise<FavoriteItem> {
        const favoriteItem = this.FavoriteItemModel.forge<FavoriteItem>(data);
        try {
            const favoriteItemCreated = await favoriteItem.save();
            return await this.FavoriteItemModel.fetchById(favoriteItemCreated.id);
        } catch (error) {
            throw new DatabaseException('Could not create the favoriteItem!', error);
        }
    }

    public async update(id: number, data: any): Promise<FavoriteItem> {
        const favoriteItem = this.FavoriteItemModel.forge<FavoriteItem>({ id });
        try {
            const favoriteItemUpdated = await favoriteItem.save(data, { patch: true });
            return this.FavoriteItemModel.fetchById(favoriteItemUpdated.id);
        } catch (error) {
            throw new DatabaseException('Could not update the favoriteItem!', error);
        }
    }

    public async destroy(id: number): Promise<void> {
        let favoriteItem = this.FavoriteItemModel.forge<FavoriteItem>({ id });
        try {
            favoriteItem = await favoriteItem.fetch({ require: true });
        } catch (error) {
            throw new NotFoundException(id);
        }

        try {
            await favoriteItem.destroy();
            return;
        } catch (error) {
            throw new DatabaseException('Could not delete the favoriteItem!', error);
        }
    }
}
