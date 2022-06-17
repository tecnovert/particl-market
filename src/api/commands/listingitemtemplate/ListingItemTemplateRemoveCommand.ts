// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as resources from 'resources';
import { inject, named } from 'inversify';
import { validate, request } from '../../../core/api/Validate';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { ListingItemTemplateService } from '../../services/model/ListingItemTemplateService';
import { RpcRequest } from '../../requests/RpcRequest';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { Commands } from '../CommandEnumType';
import { BaseCommand } from '../BaseCommand';
import { ModelNotModifiableException } from '../../exceptions/ModelNotModifiableException';
import { CommandParamValidationRules, IdValidationRule, ParamValidationRule } from '../CommandParamValidation';


export class ListingItemTemplateRemoveCommand extends BaseCommand implements RpcCommandInterface<void> {

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.model.ListingItemTemplateService) public listingItemTemplateService: ListingItemTemplateService
    ) {
        super(Commands.TEMPLATE_REMOVE);
        this.log = new Logger(__filename);
    }

    public getCommandParamValidationRules(): CommandParamValidationRules {
        return {
            params: [
                new IdValidationRule('listingItemTemplateId', true, this.listingItemTemplateService)
            ] as ParamValidationRule[]
        } as CommandParamValidationRules;
    }

    /**
     * data.params[]:
     * [0]: listingItemTemplate, resources.ListingItemTemplate
     *
     * @param data
     * @returns {Promise<ListingItemTemplate>}
     */
    @validate()
    public async execute( @request(RpcRequest) data: RpcRequest): Promise<void> {

        const listingItemTemplate: resources.ListingItemTemplate = data.params[0];
        return await this.listingItemTemplateService.destroy(listingItemTemplate.id);
    }

    /**
     * data.params[]:
     * [0]: listingItemTemplateId
     *
     * @param data
     * @returns {Promise<RpcRequest>}
     */
    public async validate(data: RpcRequest): Promise<RpcRequest> {
        await super.validate(data); // validates the basic search params, see: BaseSearchCommand.validateSearchParams()

        const listingItemTemplate: resources.ListingItemTemplate = data.params[0];

        // this.log.debug('listingItemTemplate: ', JSON.stringify(listingItemTemplate, null, 2));
        const isModifiable = await this.listingItemTemplateService.isModifiable(listingItemTemplate.id);
        if (!isModifiable) {
            throw new ModelNotModifiableException('ListingItemTemplate');
        }

        data.params[0] = listingItemTemplate;

        return data;
    }

    public usage(): string {
        return this.getName() + ' <listingTemplateId> ';
    }

    public help(): string {
        return this.usage() + ' -  ' + this.description() + ' \n'
            + '    <listingTemplateId>           - Numeric - The ID of the listing item template that we \n'
            + '                                     want to destroy. ';
    }

    public description(): string {
        return 'Destroy a ListingItemTemplate specified by the Id.';
    }

    public example(): string {
        return 'template ' + this.getName() + ' 1';
    }
}
