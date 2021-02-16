// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import * as resources from 'resources';
import * as Bookshelf from 'bookshelf';
import { inject, named } from 'inversify';
import { RpcRequest } from '../../requests/RpcRequest';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { validate, request } from '../../../core/api/Validate';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { BaseCommand } from '../BaseCommand';
import { Commands } from '../CommandEnumType';
import { ShoppingCartItem } from '../../models/ShoppingCartItem';
import { ShoppingCartItemService } from '../../services/model/ShoppingCartItemService';
import { MissingParamException } from '../../exceptions/MissingParamException';
import { InvalidParamException } from '../../exceptions/InvalidParamException';
import { ModelNotFoundException } from '../../exceptions/ModelNotFoundException';
import { ShoppingCartService } from '../../services/model/ShoppingCartService';

export class ShoppingCartItemListCommand extends BaseCommand implements RpcCommandInterface<Bookshelf.Collection<ShoppingCartItem>> {

    public log: LoggerType;

    constructor(
        @inject(Types.Service) @named(Targets.Service.model.ShoppingCartService) private shoppingCartService: ShoppingCartService,
        @inject(Types.Service) @named(Targets.Service.model.ShoppingCartItemService) private shoppingCartItemService: ShoppingCartItemService,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        super(Commands.SHOPPINGCARTITEM_LIST);
        this.log = new Logger(__filename);
    }

    /**
     * data.params[]:
     *  [0]: cart, resources.ShoppingCart
     *
     * @param data
     * @returns {Promise<Bookshelf.Collection<ShoppingCartItem>>}
     */
    @validate()
    public async execute( @request(RpcRequest) data: RpcRequest): Promise<Bookshelf.Collection<ShoppingCartItem>> {
        const shoppingCart: resources.ShoppingCart = data.params[0];
        return await this.shoppingCartItemService.findAllByCartId(shoppingCart.id);
    }

    /**
     * data.params[]:
     *  [0]: cartId, number
     *
     * @param data
     * @returns {Promise<Bookshelf.Collection<ShoppingCartItem>>}
     */
    public async validate(data: RpcRequest): Promise<RpcRequest> {

        // make sure the required params exist
        if (data.params.length < 1) {
            throw new MissingParamException('id');
        }

        // make sure the params are of correct type
        if (typeof data.params[0] !== 'number') {
            throw new InvalidParamException('id', 'number');
        }

        // make sure ShoppingCart with the id exists
        data.params[0] = await this.shoppingCartService.findOne(data.params[0])
            .then(value => value.toJSON())
            .catch(reason => {
                throw new ModelNotFoundException('ShoppingCart');
            });

        return data;
    }

    public usage(): string {
        return this.getName() + ' <cartId>';
    }

    public help(): string {
        return this.usage() + ' -  ' + this.description() + ' \n'
            + '    <cartId>                 - The Id of the ShoppingCart. \n';
    }

    public description(): string {
        return 'List all ShoppingCartItems in ShoppingCart.';
    }

    public example(): string {
        return 'cartitem ' + this.getName() + ' 1 ' + true;
    }
}
