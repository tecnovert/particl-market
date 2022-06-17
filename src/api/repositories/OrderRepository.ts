// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Bookshelf from 'bookshelf';
import { inject, named } from 'inversify';
import { Types, Core, Targets } from '../../constants';
import { Order } from '../models/Order';
import { DatabaseException } from '../exceptions/DatabaseException';
import { NotFoundException } from '../exceptions/NotFoundException';
import { Logger as LoggerType } from '../../core/Logger';
import { OrderSearchParams } from '../requests/search/OrderSearchParams';

export class OrderRepository {

    public log: LoggerType;

    constructor(
        @inject(Types.Model) @named(Targets.Model.Order) public OrderModel: typeof Order,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    public async findAll(): Promise<Bookshelf.Collection<Order>> {
        const list = await this.OrderModel.fetchAll<Order>();
        return list;
    }

    public async findOne(id: number, withRelated: boolean = true): Promise<Order> {
        return this.OrderModel.fetchById(id, withRelated);
    }

    public async findOneByHash(hash: string, withRelated: boolean = true): Promise<Order> {
        return this.OrderModel.fetchByHash(hash, withRelated);
    }

    /**
     *
     * @param options, OrderSearchParams
     * @param withRelated
     * @returns {Promise<Bookshelf.Collection<Order>>}
     */
    public async search(options: OrderSearchParams, withRelated: boolean): Promise<Bookshelf.Collection<Order>> {
        return this.OrderModel.searchBy(options, withRelated);
    }

    public async create(data: any): Promise<Order> {
        const order = this.OrderModel.forge<Order>(data);
        try {
            const orderCreated = await order.save();
            return this.OrderModel.fetchById(orderCreated.id);
        } catch (error) {
            throw new DatabaseException('Could not create the order!', error);
        }
    }

    public async update(id: number, data: any): Promise<Order> {
        const order = this.OrderModel.forge<Order>({ id });
        try {
            const orderUpdated = await order.save(data, { patch: true });
            return this.OrderModel.fetchById(orderUpdated.id);
        } catch (error) {
            throw new DatabaseException('Could not update the order!', error);
        }
    }

    public async destroy(id: number): Promise<void> {
        let order = this.OrderModel.forge<Order>({ id });
        try {
            order = await order.fetch({ require: true });
        } catch (error) {
            throw new NotFoundException(id);
        }

        try {
            await order.destroy();
            return;
        } catch (error) {
            this.log.debug('error:', error);
            throw new DatabaseException('Could not delete the order!', error);
        }
    }

}
