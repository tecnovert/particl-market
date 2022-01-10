// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Bookshelf from 'bookshelf';
import { inject, named } from 'inversify';
import { Types, Core, Targets } from '../../constants';
import { Bid } from '../models/Bid';
import { DatabaseException } from '../exceptions/DatabaseException';
import { NotFoundException } from '../exceptions/NotFoundException';
import { Logger as LoggerType } from '../../core/Logger';
import { BidSearchParams } from '../requests/search/BidSearchParams';

export class BidRepository {

    public log: LoggerType;

    constructor(
        @inject(Types.Model) @named(Targets.Model.Bid) public BidModel: typeof Bid,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    public async findAllByProfileId(id: number, withRelated: boolean = true): Promise<Bookshelf.Collection<Bid>> {
        return await this.BidModel.fetchAllByProfileId(id, withRelated);
    }

    public async findAllByIdentityId(id: number, withRelated: boolean = true): Promise<Bookshelf.Collection<Bid>> {
        return await this.BidModel.fetchAllByIdentityId(id, withRelated);
    }

    public async findAll(): Promise<Bookshelf.Collection<Bid>> {
        const list = await this.BidModel.fetchAll();
        return list as Bookshelf.Collection<Bid>;
    }

    public async findOne(id: number, withRelated: boolean = true): Promise<Bid> {
        return this.BidModel.fetchById(id, withRelated);
    }

    public async findOneByHash(hash: string, withRelated: boolean = true): Promise<Bid> {
        return this.BidModel.fetchByHash(hash, withRelated);
    }

    public async findOneByMsgId(msgId: string, withRelated: boolean = true): Promise<Bid> {
        return this.BidModel.fetchByMsgId(msgId, withRelated);
    }

    /**
     *
     * @param options, BidSearchParams
     * @param withRelated
     * @returns {Promise<Bookshelf.Collection<Bid>>}
     */
    public async search(options: BidSearchParams, withRelated: boolean): Promise<Bookshelf.Collection<Bid>> {
        return this.BidModel.searchBy(options, withRelated);
    }

    public async create(data: any): Promise<Bid> {
        const bid = this.BidModel.forge<Bid>(data);
        try {
            const bidCreated = await bid.save();
            return this.BidModel.fetchById(bidCreated.id);
        } catch (error) {
            this.log.error('Could not creat the bid!', error);
            throw new DatabaseException('Could not create the bid!', error);
        }
    }

    public async update(id: number, data: any): Promise<Bid> {
        const bid = this.BidModel.forge<Bid>({ id });
        try {
            const bidUpdated = await bid.save(data, { patch: true });
            return this.BidModel.fetchById(bidUpdated.id);
        } catch (error) {
            throw new DatabaseException('Could not update the bid!', error);
        }
    }

    public async destroy(id: number): Promise<void> {
        let bid = this.BidModel.forge<Bid>({ id });
        try {
            bid = await bid.fetch({ require: true });
        } catch (error) {
            throw new NotFoundException(id);
        }

        try {
            await bid.destroy();
            return;
        } catch (error) {
            throw new DatabaseException('Could not delete the bid!', error);
        }
    }

}
