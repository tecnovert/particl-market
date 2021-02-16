// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Bookshelf from 'bookshelf';
import { inject, named } from 'inversify';
import { validate, request } from '../../../core/api/Validate';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { ListingItemObjectService } from '../../services/model/ListingItemObjectService';
import { RpcRequest } from '../../requests/RpcRequest';
import { ListingItemObject } from '../../models/ListingItemObject';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { ListingItemObjectSearchParams } from '../../requests/search/ListingItemObjectSearchParams';
import { Commands} from '../CommandEnumType';
import { BaseCommand } from '../BaseCommand';
import { InvalidParamException } from '../../exceptions/InvalidParamException';
import { MissingParamException } from '../../exceptions/MissingParamException';

export class ListingItemObjectSearchCommand extends BaseCommand implements RpcCommandInterface<Bookshelf.Collection<ListingItemObject>> {

    public log: LoggerType;

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.model.ListingItemObjectService) public listingItemObjectService: ListingItemObjectService
    ) {
        super(Commands.ITEMOBJECT_SEARCH);
        this.log = new Logger(__filename);
    }

    /**
     * data.params[]:
     *  [0]: searchString, string
     *
     * @param data
     * @returns {Promise<ListingItemObject>}
     */
    @validate()
    public async execute( @request(RpcRequest) data: RpcRequest): Promise<Bookshelf.Collection<ListingItemObject>> {
        return this.listingItemObjectService.search({
            searchString: data.params[0]
        } as ListingItemObjectSearchParams);
    }

    /**
     * data.params[]:
     *  [0]: searchString, string
     *
     * @param data
     * @returns {Promise<RpcRequest>}
     */
    public async validate(data: RpcRequest): Promise<RpcRequest> {
        if (data.params.length < 1) {
            throw new MissingParamException('searchString');
        }

        if (typeof data.params[0] !== 'string') {
            throw new InvalidParamException('searchString', 'string');
        }

        return data;
    }

    public usage(): string {
        return this.getName() + ' <searchString> ';
    }

    public help(): string {
        return this.usage() + ' -  ' + this.description() + ' \n'
            + '    <searchString>           - String - A string that is used to find ListingItemObjects. ';
    }

    public description(): string {
        return 'Search ListingItemObjects by given string.';
    }

    public example(): string {
        return 'itemobject ' + this.getName() + ' \'rubber chicken with a pully in the middle\' ';
    }
}
