// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import * as resources from 'resources';
import {inject, named} from 'inversify';
import {request, validate} from '../../../core/api/Validate';
import {Logger as LoggerType} from '../../../core/Logger';
import {Core, Targets, Types} from '../../../constants';
import {ListingItemService} from '../../services/model/ListingItemService';
import {RpcRequest} from '../../requests/RpcRequest';
import {RpcCommandInterface} from '../RpcCommandInterface';
import {Commands} from '../CommandEnumType';
import {BaseCommand} from '../BaseCommand';
import {ImageDataService} from '../../services/model/ImageDataService';
import {BooleanValidationRule, CommandParamValidationRules, IdValidationRule, ParamValidationRule} from '../CommandParamValidation';
import {ProtocolDSN} from '@zasmilingidiot/omp-lib/dist/interfaces/dsn';

export class ListingItemGetCommand extends BaseCommand implements RpcCommandInterface<resources.ListingItem> {

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.model.ImageDataService) private imageDataService: ImageDataService,
        @inject(Types.Service) @named(Targets.Service.model.ListingItemService) public listingItemService: ListingItemService
    ) {
        super(Commands.ITEM_GET);
        this.log = new Logger(__filename);
    }

    public getCommandParamValidationRules(): CommandParamValidationRules {
        return {
            params: [
                new IdValidationRule('listingItemId', true, this.listingItemService),
                new BooleanValidationRule('returnImageData', false, false)
            ] as ParamValidationRule[]
        } as CommandParamValidationRules;
    }

    /**
     * data.params[]:
     * [0]: listingItem: resources.ListingItem
     * [1]: returnImageData
     *
     * @param data
     * @returns {Promise<ListingItem>}
     */
    @validate()
    public async execute( @request(RpcRequest) data: RpcRequest): Promise<resources.ListingItem> {

        const listingItem: resources.ListingItem = data.params[0];
        const returnImageData: boolean = data.params[1];

        if (returnImageData && !_.isEmpty(listingItem.ItemInformation.Images)) {
            for (const image of listingItem.ItemInformation.Images) {
                for (const imageData of image.ImageDatas) {
                    if (imageData.protocol === ProtocolDSN.FILE) {
                        imageData.data = await this.imageDataService.loadImageFile(image.hash, imageData.imageVersion);
                    }
                }
            }
        }

        return listingItem;
    }

    /**
     * data.params[]:
     * [0]: listingItemId
     * [1]: returnImageData (optional)
     *
     * @param {RpcRequest} data
     * @returns {Promise<RpcRequest>}
     */
    public async validate(data: RpcRequest): Promise<RpcRequest> {
        await super.validate(data); // validates the basic search params, see: BaseSearchCommand.validateSearchParams()
        return data;
    }

    public usage(): string {
        return this.getName() + ' <listingItemId> [returnImageData]';
    }

    public help(): string {
        return this.usage() + ' -  ' + this.description() + ' \n'
            + '    <listingItemId>          - number - The Id of the ListingItem we want to retrieve. \n'
            + '    <returnImageData>        - number, optional - Whether to return image data or not. ';
    }

    public description(): string {
        return 'Get a ListingItem.';
    }

    public example(): string {
        return 'item ' + this.getName() + ' 1';
    }
}
