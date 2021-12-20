// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE
import * as resources from 'resources';
import { inject, named } from 'inversify';
import { validate, request } from '../../../core/api/Validate';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { RpcRequest } from '../../requests/RpcRequest';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { IdentityService } from './../../services/model/IdentityService';
import { Commands} from '../CommandEnumType';
import { BaseCommand } from '../BaseCommand';
import { IdentityType } from '../../enums/IdentityType';

export class ProfileListCommand extends BaseCommand implements RpcCommandInterface<resources.Identity[]> {

    public log: LoggerType;

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.model.IdentityService) private identityService: IdentityService
    ) {
        super(Commands.PROFILE_LIST);
        this.log = new Logger(__filename);
    }

    /**
     *
     * @param data
     * @returns {Promise<resources.Identity[]>}
     */
    @validate()
    public async execute( @request(RpcRequest) data: RpcRequest): Promise<resources.Identity[]> {
        const profileIdentities = await this.identityService.findAll()
            .then(value => value.toJSON())
            .catch(() => [])
            .then((identities: resources.Identity[]) => identities.filter((identity) => identity.type === IdentityType.PROFILE));
        return profileIdentities;
    }

    public async validate(data: RpcRequest): Promise<RpcRequest> {
        return data;
    }

    public usage(): string {
        return this.getName() + ' ';
    }

    public help(): string {
        return this.usage() + ' -  ' + this.description() + ' \n';
    }

    public description(): string {
        return 'List all the Profiles.';
    }

    public example(): string {
        return 'profile ' + this.getName() + ' ';
    }
}
