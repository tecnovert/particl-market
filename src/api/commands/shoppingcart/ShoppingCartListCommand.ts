// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import * as resources from 'resources';
import { inject, named } from 'inversify';
import { RpcRequest } from '../../requests/RpcRequest';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { validate, request } from '../../../core/api/Validate';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { BaseCommand } from '../BaseCommand';
import { Commands } from '../CommandEnumType';
import { ShoppingCartService } from '../../services/model/ShoppingCartService';
import { ProfileService } from '../../services/model/ProfileService';
import { InvalidParamException } from '../../exceptions/InvalidParamException';
import { ModelNotFoundException } from '../../exceptions/ModelNotFoundException';
import { IdentityService } from '../../services/model/IdentityService';

export class ShoppingCartListCommand extends BaseCommand implements RpcCommandInterface<resources.ShoppingCart[]> {

    public log: LoggerType;

    constructor(
        @inject(Types.Service) @named(Targets.Service.model.ShoppingCartService) private shoppingCartService: ShoppingCartService,
        @inject(Types.Service) @named(Targets.Service.model.ProfileService) private profileService: ProfileService,
        @inject(Types.Service) @named(Targets.Service.model.IdentityService) private identityService: IdentityService,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        super(Commands.SHOPPINGCART_LIST);
        this.log = new Logger(__filename);
    }

    /**
     * data.params[]:
     * [0]: profile: resources.Profile
     *
     * @param data
     * @returns {Promise<Bookshelf.Collection<ShoppingCart>>}
     */
    @validate()
    public async execute( @request(RpcRequest) data: RpcRequest): Promise<resources.ShoppingCart[]> {

        const profile: resources.Profile = data.params[0];
        const carts: resources.ShoppingCart[] = [];

        for (const identity of profile.Identities) {
            const identityCarts: resources.ShoppingCart[] = await this.shoppingCartService.findAllByIdentityId(identity.id, true)
                .then(value => value.toJSON());
            carts.push(...identityCarts);
        }
        return carts;
    }

    /**
     * data.params[]:
     * [0]: profileId, optional
     *
     * @param {RpcRequest} data
     * @returns {Promise<RpcRequest>}
     */
    public async validate(data: RpcRequest): Promise<RpcRequest> {

        // make sure the params are of correct type
        if (!_.isNil(data.params[0]) && typeof data.params[0] !== 'number') {
            throw new InvalidParamException('profileId', 'number');
        }

        if (data.params.length === 0) {
            data.params[0] = await this.profileService.getDefault()
                .then(value => value.toJSON())
                .catch(() => {
                    throw new ModelNotFoundException('Profile');
                });
        } else {
            data.params[0] = await this.profileService.findOne(+(data.params[0] as number))
                .then(value => value.toJSON())
                .catch(() => {
                    throw new ModelNotFoundException('Profile');
                });
        }

        return data;
    }

    public usage(): string {
        return this.getName() + ' [profileId] ';
    }

    public help(): string {
        return this.usage() + ' -  ' + this.description() + ' \n'
            + '    <profileId>              - The id of the Profile associated with the ShoppingCart. \n';
    }

    public description(): string {
        return 'List the all ShoppingCarts associated with the Profile.';
    }

    public example(): string {
        return 'cart ' + this.getName() + ' 1 ';
    }
}
