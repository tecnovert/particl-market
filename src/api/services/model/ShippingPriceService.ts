// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Bookshelf from 'bookshelf';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { validate, request } from '../../../core/api/Validate';
import { NotFoundException } from '../../exceptions/NotFoundException';
import { ShippingPriceRepository } from '../../repositories/ShippingPriceRepository';
import { ShippingPrice } from '../../models/ShippingPrice';
import { ShippingPriceCreateRequest } from '../../requests/model/ShippingPriceCreateRequest';
import { ShippingPriceUpdateRequest } from '../../requests/model/ShippingPriceUpdateRequest';

export class ShippingPriceService {

    public log: LoggerType;

    constructor(
        @inject(Types.Repository) @named(Targets.Repository.ShippingPriceRepository) public shippingPriceRepo: ShippingPriceRepository,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    public async findAll(): Promise<Bookshelf.Collection<ShippingPrice>> {
        return this.shippingPriceRepo.findAll();
    }

    public async findOne(id: number, withRelated: boolean = true): Promise<ShippingPrice> {
        const shippingPrice = await this.shippingPriceRepo.findOne(id, withRelated);
        if (shippingPrice === null) {
            this.log.warn(`ShippingPrice with the id=${id} was not found!`);
            throw new NotFoundException(id);
        }
        return shippingPrice;
    }

    @validate()
    public async create( @request(ShippingPriceCreateRequest) data: ShippingPriceCreateRequest): Promise<ShippingPrice> {
        const body = JSON.parse(JSON.stringify(data));
        const shippingPrice = await this.shippingPriceRepo.create(body);
        return await this.findOne(shippingPrice.Id);
    }

    @validate()
    public async update(id: number, @request(ShippingPriceUpdateRequest) data: ShippingPriceUpdateRequest): Promise<ShippingPrice> {

        const body = JSON.parse(JSON.stringify(data));

        // find the existing one without related
        const shippingPrice = await this.findOne(id, false);

        // set new values
        shippingPrice.Domestic = body.domestic;
        shippingPrice.International = body.international;

        // update shippingPrice record
        const updatedShippingPrice = await this.shippingPriceRepo.update(id, shippingPrice.toJSON());

        return updatedShippingPrice;
    }

    public async destroy(id: number): Promise<void> {
        await this.shippingPriceRepo.destroy(id);
    }
}
