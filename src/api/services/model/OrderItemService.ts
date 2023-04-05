// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Bookshelf from 'bookshelf';
import * as resources from 'resources';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { validate, request } from '../../../core/api/Validate';
import { NotFoundException } from '../../exceptions/NotFoundException';
import { OrderItemRepository } from '../../repositories/OrderItemRepository';
import { OrderItem } from '../../models/OrderItem';
import { OrderItemCreateRequest } from '../../requests/model/OrderItemCreateRequest';
import { OrderItemUpdateRequest } from '../../requests/model/OrderItemUpdateRequest';
import { OrderItemStatus } from '../../enums/OrderItemStatus';
import { OrderItemStatusSequence } from '../../enums/OrderItemStatusSequence';
import { OrderItemSearchParams } from '../../requests/search/OrderItemSearchParams';

export class OrderItemService {

    public log: LoggerType;
    private readonly madctBuyFlowSequence: OrderItemStatusSequence;

    constructor(
        @inject(Types.Repository) @named(Targets.Repository.OrderItemRepository) public orderItemRepo: OrderItemRepository,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);

        this.madctBuyFlowSequence = {};
        this.madctBuyFlowSequence[OrderItemStatus.BIDDED] = {
            nextStates: [OrderItemStatus.BID_CANCELLED, OrderItemStatus.BID_REJECTED, OrderItemStatus.AWAITING_ESCROW]
        };
        this.madctBuyFlowSequence[OrderItemStatus.AWAITING_ESCROW] = {
            nextStates: [OrderItemStatus.BID_CANCELLED, OrderItemStatus.ESCROW_LOCKED]
        };
        this.madctBuyFlowSequence[OrderItemStatus.ESCROW_LOCKED] = {
            nextStates: [OrderItemStatus.BID_CANCELLED, OrderItemStatus.ESCROW_COMPLETED]
        };
        this.madctBuyFlowSequence[OrderItemStatus.ESCROW_COMPLETED] = {
            nextStates: [OrderItemStatus.SHIPPING, OrderItemStatus.COMPLETE]
        };
        this.madctBuyFlowSequence[OrderItemStatus.SHIPPING] = {
            nextStates: [OrderItemStatus.COMPLETE]
        };
        this.madctBuyFlowSequence[OrderItemStatus.BID_CANCELLED] = {
            nextStates: [OrderItemStatus.ESCROW_COMPLETED]
        };
    }

    public async findAll(): Promise<Bookshelf.Collection<OrderItem>> {
        return this.orderItemRepo.findAll();
    }

    public async findOne(id: number, withRelated: boolean = true): Promise<OrderItem> {
        const orderItem = await this.orderItemRepo.findOne(id, withRelated);
        if (orderItem === null) {
            this.log.warn(`OrderItem with the id=${id} was not found!`);
            throw new NotFoundException(id);
        }
        return orderItem;
    }

    /**
     * searchBy OrderItems using given OrderItemSearchParams
     *
     * @param options
     * @param withRelated
     * @returns {Promise<Bookshelf.Collection<OrderItem>>}
     */
    @validate()
    public async search(@request(OrderItemSearchParams) options: OrderItemSearchParams, withRelated: boolean = true): Promise<Bookshelf.Collection<OrderItem>> {
        // this.log.debug('search(), options: ', JSON.stringify(options, null, 2));
        return await this.orderItemRepo.search(options, withRelated);
    }

    @validate()
    public async create( @request(OrderItemCreateRequest) data: OrderItemCreateRequest): Promise<OrderItem> {

        const body: OrderItemCreateRequest = JSON.parse(JSON.stringify(data));
        // this.log.debug('OrderItemCreateRequest: ', JSON.stringify(body, null, 2));

        // this.log.debug('create OrderItem, body: ', JSON.stringify(body, null, 2));

        // If the request body was valid we will create the orderItem
        const orderItem: resources.Order = await this.orderItemRepo.create(body).then(value => value.toJSON());

        // this.log.debug('created orderItem: ', JSON.stringify(orderItem, null, 2));

        // finally find and return the created orderItem
        const newOrderItem = await this.findOne(orderItem.id);
        return newOrderItem;
    }

    @validate()
    public async update(id: number, @request(OrderItemUpdateRequest) body: OrderItemUpdateRequest): Promise<OrderItem> {

        // find the existing one without related
        const orderItem = await this.findOne(id, false);

        // set new values
        orderItem.Status = body.status;

        // update orderItem record
        const updatedOrderItem = await this.orderItemRepo.update(id, orderItem.toJSON());

        // const newOrderItem = await this.findOne(id);
        // return newOrderItem;

        return updatedOrderItem;
    }

    public async destroy(id: number): Promise<void> {
        await this.orderItemRepo.destroy(id);
    }

    public async updateStatus(id: number, status: OrderItemStatus): Promise<OrderItem> {
        const orderItem = await this.findOne(id, false);
        orderItem.Status = status;
        const updated = await this.orderItemRepo.update(id, orderItem.toJSON());
        this.log.debug(`updated OrderItem ${id} status to: ${updated.Status}`);
        return updated;
    }


    public isNextStatusValid(currentStatus: OrderItemStatus, toStatus: OrderItemStatus): boolean {
        return (this.madctBuyFlowSequence[currentStatus] || {nextStates: []}).nextStates.findIndex(status => toStatus && (status === toStatus)) >= 0;
    }

}
