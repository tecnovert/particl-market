// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Bookshelf from 'bookshelf';
import { inject, named } from 'inversify';
import { Types, Core, Targets } from '../../constants';
import { OrderItem } from '../models/OrderItem';
import { DatabaseException } from '../exceptions/DatabaseException';
import { NotFoundException } from '../exceptions/NotFoundException';
import { Logger as LoggerType } from '../../core/Logger';
import { OrderItemSearchParams } from '../requests/search/OrderItemSearchParams';

export class OrderItemRepository {

    public log: LoggerType;

    constructor(
        @inject(Types.Model) @named(Targets.Model.OrderItem) public OrderItemModel: typeof OrderItem,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    public async findAll(): Promise<Bookshelf.Collection<OrderItem>> {
        const list = await this.OrderItemModel.fetchAll();
        return list as Bookshelf.Collection<OrderItem>;
    }

    public async findOne(id: number, withRelated: boolean = true): Promise<OrderItem> {
        return this.OrderItemModel.fetchById(id, withRelated);
    }

    /**
     *
     * @param options, OrderItemSearchParams
     * @param withRelated
     * @returns {Promise<Bookshelf.Collection<OrderItem>>}
     */
    public async search(options: OrderItemSearchParams, withRelated: boolean): Promise<Bookshelf.Collection<OrderItem>> {
        return this.OrderItemModel.searchBy(options, withRelated);
    }

    public async create(data: any): Promise<OrderItem> {
        const orderItem = this.OrderItemModel.forge<OrderItem>(data);
        try {
            const orderItemCreated = await orderItem.save();
            return this.OrderItemModel.fetchById(orderItemCreated.id);
        } catch (error) {
            throw new DatabaseException('Could not create the orderItem!', error);
        }
    }

    public async update(id: number, data: any): Promise<OrderItem> {
        const orderItem = this.OrderItemModel.forge<OrderItem>({ id });
        try {
            const orderItemUpdated = await orderItem.save(data, { patch: true });
            return this.OrderItemModel.fetchById(orderItemUpdated.id);
        } catch (error) {
            throw new DatabaseException('Could not update the orderItem!', error);
        }
    }

    public async destroy(id: number): Promise<void> {
        let orderItem = this.OrderItemModel.forge<OrderItem>({ id });
        try {
            orderItem = await orderItem.fetch({ require: true });
        } catch (error) {
            throw new NotFoundException(id);
        }

        try {
            await orderItem.destroy();
            return;
        } catch (error) {
            throw new DatabaseException('Could not delete the orderItem!', error);
        }
    }

}
