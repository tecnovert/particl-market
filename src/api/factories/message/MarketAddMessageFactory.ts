// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../../core/Logger';
import { Core, Targets, Types } from '../../../constants';
import { MarketAddMessage } from '../../messages/action/MarketAddMessage';
import { MissingParamException } from '../../exceptions/MissingParamException';
// import { MarketImageAddMessageFactory } from './MarketImageAddMessageFactory';
import { MarketAddRequest } from '../../requests/action/MarketAddRequest';
import { MPActionExtended } from '../../enums/MPActionExtended';
import { ConfigurableHasher } from '@zasmilingidiot/omp-lib/dist/hasher/hash';
import { HashableMarketAddMessageConfig } from '../hashableconfig/message/HashableMarketAddMessageConfig';
import { ContentReference, DSN } from '@zasmilingidiot/omp-lib/dist/interfaces/dsn';
import { ListingItemImageAddMessageFactory } from './ListingItemImageAddMessageFactory';
import { BaseMessageFactory } from '../BaseMessageFactory';
import { MarketplaceMessage } from '../../messages/MarketplaceMessage';
import {HashableMarketField} from '../hashableconfig/HashableField';

export class MarketAddMessageFactory extends BaseMessageFactory {

    public log: LoggerType;

    constructor(
        /* eslint-disable max-len */
        // @inject(Types.Factory) @named(Targets.Factory.message.MarketImageAddMessageFactory) private marketImageAddMessageFactory: MarketImageAddMessageFactory,
        @inject(Types.Factory) @named(Targets.Factory.message.ListingItemImageAddMessageFactory) private listingItemImageAddMessageFactory: ListingItemImageAddMessageFactory,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
        /* eslint-enable max-len */
    ) {
        super();
        this.log = new Logger(__filename);
    }

    /**
     * Creates a MarketAddMessage from given parameters
     *
     * @param actionRequest
     * @returns {Promise<MarketplaceMessage>}
     */

    public async get(actionRequest: MarketAddRequest): Promise<MarketplaceMessage> {

        if (!actionRequest.market) {
            throw new MissingParamException('market');
        }

        let image: ContentReference | undefined;

        // this.log.debug('actionRequest: ', JSON.stringify(actionRequest, null, 2));
        if (!_.isNil(actionRequest.market.Image)) {
            const imageData: DSN[] = await this.listingItemImageAddMessageFactory.getDSNs(actionRequest.market.Image.ImageDatas, false);
            image = {
                hash: actionRequest.market.Image.hash,
                data: imageData
            } as ContentReference;
        }

        const message = {
            name: actionRequest.market.name,
            description: actionRequest.market.description || '',
            type: MPActionExtended.MPA_MARKET_ADD,
            marketType: actionRequest.market.type,
            region: actionRequest.market.region,
            receiveKey: actionRequest.market.receiveKey,
            publishKey: actionRequest.market.publishKey,
            image,
            generated: Date.now(),
            hash: 'recalculateandvalidate'
        } as MarketAddMessage;

        message.hash = ConfigurableHasher.hash(message, new HashableMarketAddMessageConfig([{
            value: actionRequest.market.receiveAddress,
            to: HashableMarketField.MARKET_RECEIVE_ADDRESS
        }, {
            value: actionRequest.market.publishAddress,
            to: HashableMarketField.MARKET_PUBLISH_ADDRESS
        }]));

        return await this.getMarketplaceMessage(message);
    }
}
