// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Bookshelf from 'bookshelf';
import { inject, named } from 'inversify';
import { Types, Core, Targets } from '../../constants';
import { ItemInformation } from '../models/ItemInformation';
import { DatabaseException } from '../exceptions/DatabaseException';
import { NotFoundException } from '../exceptions/NotFoundException';
import { Logger as LoggerType } from '../../core/Logger';

export class ItemInformationRepository {

    public log: LoggerType;

    constructor(
        @inject(Types.Model) @named(Targets.Model.ItemInformation) public ItemInformationModel: typeof ItemInformation,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    public async findAll(): Promise<Bookshelf.Collection<ItemInformation>> {
        const list = await this.ItemInformationModel.fetchAll<ItemInformation>();
        return list;
    }

    public async findOne(id: number, withRelated: boolean = true): Promise<ItemInformation> {
        return await this.ItemInformationModel.fetchById(id, withRelated);
    }

    public async findByItemTemplateId(listingItemTemplateId: number, withRelated: boolean = true): Promise<ItemInformation> {
        return await this.ItemInformationModel.findByItemTemplateId(listingItemTemplateId, withRelated);
    }

    public async create(data: any): Promise<ItemInformation> {
        const itemInformation = this.ItemInformationModel.forge<ItemInformation>(data);
        try {
            const itemInformationCreated = await itemInformation.save();
            const result = await this.ItemInformationModel.fetchById(itemInformationCreated.id);
            return result;
        } catch (error) {
            throw new DatabaseException('Could not create the itemInformation!', error);
        }
    }

    public async update(id: number, data: any): Promise<ItemInformation> {
        const itemInformation = this.ItemInformationModel.forge<ItemInformation>({ id });
        try {
            const itemInformationUpdated = await itemInformation.save(data, { patch: true });
            return await this.ItemInformationModel.fetchById(itemInformationUpdated.id);
        } catch (error) {
            throw new DatabaseException('Could not update the itemInformation!', error);
        }
    }

    public async destroy(id: number): Promise<void> {
        let itemInformation = this.ItemInformationModel.forge<ItemInformation>({ id });
        try {
            itemInformation = await itemInformation.fetch({ require: true });
        } catch (error) {
            throw new NotFoundException(id);
        }

        try {
            await itemInformation.destroy();
            return;
        } catch (error) {
            throw new DatabaseException('Could not delete the itemInformation!', error);
        }
    }

}
