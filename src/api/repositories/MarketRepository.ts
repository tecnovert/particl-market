// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Bookshelf from 'bookshelf';
import { inject, named } from 'inversify';
import { Types, Core, Targets } from '../../constants';
import { Market } from '../models/Market';
import { DatabaseException } from '../exceptions/DatabaseException';
import { NotFoundException } from '../exceptions/NotFoundException';
import { Logger as LoggerType } from '../../core/Logger';
import { MarketSearchParams } from '../requests/search/MarketSearchParams';


export class MarketRepository {

    public log: LoggerType;

    constructor(
        @inject(Types.Model) @named(Targets.Model.Market) public MarketModel: typeof Market,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    public async findAll(): Promise<Bookshelf.Collection<Market>> {
        const list = await this.MarketModel.fetchAll<Market>();
        return list;
    }

    public async findAllByProfileId(profileId: number | undefined, withRelated: boolean = true): Promise<Bookshelf.Collection<Market>> {
        return await this.MarketModel.fetchAllByProfileId(profileId, withRelated);
    }

    public async findAllByReceiveAddress(receiveAddress: string, withRelated: boolean = true): Promise<Bookshelf.Collection<Market>> {
        return await this.MarketModel.fetchAllByReceiveAddress(receiveAddress, withRelated);
    }

    public async findAllByRegion(region: string, withRelated: boolean = true): Promise<Bookshelf.Collection<Market>> {
        return await this.MarketModel.fetchAllByRegion(region, withRelated);
    }

    public async findAllByHash(hash: string, withRelated: boolean = true): Promise<Bookshelf.Collection<Market>> {
        return await this.MarketModel.fetchAllByHash(hash, withRelated);
    }

    public async findAllExpired(): Promise<Bookshelf.Collection<Market>> {
        return this.MarketModel.fetchAllExpired();
    }

    public async findOne(id: number, withRelated: boolean = true): Promise<Market> {
        return await this.MarketModel.fetchById(id, withRelated);
    }

    public async findOneByMsgId(msgid: string, withRelated: boolean = true): Promise<Market> {
        return await this.MarketModel.fetchByMsgId(msgid, withRelated);
    }

    public async findOneByProfileIdAndReceiveAddress(profileId: number, receiveAddress: string, withRelated: boolean = true): Promise<Market> {
        return await this.MarketModel.fetchByProfileIdAndReceiveAddress(profileId, receiveAddress, withRelated);
    }

    public async search(options: MarketSearchParams, withRelated: boolean): Promise<Bookshelf.Collection<Market>> {
        return this.MarketModel.searchBy(options, withRelated);
    }

    public async create(data: any): Promise<Market> {
        const market = this.MarketModel.forge<Market>(data);
        try {
            const marketCreated = await market.save();
            return await this.MarketModel.fetchById(marketCreated.id);
        } catch (error) {
            this.log.error('ERROR: ', error);
            throw new DatabaseException('Could not create the market!', error);
        }
    }

    public async update(id: number, data: any): Promise<Market> {
        const market = this.MarketModel.forge<Market>({ id });
        try {
            const marketUpdated = await market.save(data, { patch: true });
            return await this.MarketModel.fetchById(marketUpdated.id);
        } catch (error) {
            throw new DatabaseException('Could not update the market!', error);
        }
    }

    public async destroy(id: number): Promise<void> {
        let market = this.MarketModel.forge<Market>({ id });
        try {
            market = await market.fetch({ require: true });
        } catch (error) {
            throw new NotFoundException(id);
        }

        try {
            await market.destroy();
            return;
        } catch (error) {
            throw new DatabaseException('Could not delete the market!', error);
        }
    }

}
