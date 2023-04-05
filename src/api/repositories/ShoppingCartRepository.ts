// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Bookshelf from 'bookshelf';
import { inject, named } from 'inversify';
import { Types, Core, Targets } from '../../constants';
import { ShoppingCart } from '../models/ShoppingCart';
import { DatabaseException } from '../exceptions/DatabaseException';
import { NotFoundException } from '../exceptions/NotFoundException';
import { Logger as LoggerType } from '../../core/Logger';

export class ShoppingCartRepository {

    public log: LoggerType;

    constructor(
        @inject(Types.Model) @named(Targets.Model.ShoppingCart) public ShoppingCartModel: typeof ShoppingCart,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    public async findAll(): Promise<Bookshelf.Collection<ShoppingCart>> {
        const list = await this.ShoppingCartModel.fetchAll<ShoppingCart>();
        return list;
    }

    public async findAllByIdentityId(identityId: number, withRelated: boolean = false): Promise<Bookshelf.Collection<ShoppingCart>> {
        return await this.ShoppingCartModel.fetchAllByIdentityId(identityId, withRelated);
    }

    public async findOne(id: number, withRelated: boolean = true): Promise<ShoppingCart> {
        return this.ShoppingCartModel.fetchById(id, withRelated);
    }

    public async create(data: any): Promise<ShoppingCart> {
        const shoppingCart = this.ShoppingCartModel.forge<ShoppingCart>(data);
        try {
            const shoppingCartCreated = await shoppingCart.save();
            return this.ShoppingCartModel.fetchById(shoppingCartCreated.id);
        } catch (error) {
            throw new DatabaseException('Could not create the shoppingCart!', error);
        }
    }

    public async update(id: number, data: any): Promise<ShoppingCart> {
        const shoppingCart = this.ShoppingCartModel.forge<ShoppingCart>({ id });
        try {
            const shoppingCartUpdated = await shoppingCart.save(data, { patch: true });
            return this.ShoppingCartModel.fetchById(shoppingCartUpdated.id);
        } catch (error) {
            throw new DatabaseException('Could not update the shoppingCart!', error);
        }
    }

    public async destroy(id: number): Promise<void> {
        let shoppingCart = this.ShoppingCartModel.forge<ShoppingCart>({ id });
        try {
            shoppingCart = await shoppingCart.fetch({ require: true });
        } catch (error) {
            throw new NotFoundException(id);
        }

        try {
            await shoppingCart.destroy();
            return;
        } catch (error) {
            throw new DatabaseException('Could not delete the shoppingCart!', error);
        }
    }

}
