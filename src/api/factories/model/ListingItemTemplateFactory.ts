// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core } from '../../../constants';
import { ItemInformationCreateRequest } from '../../requests/model/ItemInformationCreateRequest';
import { PaymentInformationCreateRequest } from '../../requests/model/PaymentInformationCreateRequest';
import { EscrowCreateRequest } from '../../requests/model/EscrowCreateRequest';
import { EscrowRatioCreateRequest } from '../../requests/model/EscrowRatioCreateRequest';
import { ItemPriceCreateRequest } from '../../requests/model/ItemPriceCreateRequest';
import { ShippingPriceCreateRequest } from '../../requests/model/ShippingPriceCreateRequest';
import { ModelFactoryInterface } from '../ModelFactoryInterface';
import { ListingItemTemplateCreateParams } from '../ModelCreateParams';
import { ListingItemTemplateCreateRequest } from '../../requests/model/ListingItemTemplateCreateRequest';


export class ListingItemTemplateFactory implements ModelFactoryInterface {

    public log: LoggerType;

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    /**
     * create a ListingItemTemplateCreateRequest
     *
     * @param params
     */
    public async get(params: ListingItemTemplateCreateParams): Promise<ListingItemTemplateCreateRequest> {

        const createRequest = {
            profile_id: params.profileId,
            parent_listing_item_template_id: params.parentListingItemTemplateId,
            generatedAt: +Date.now(),
            itemInformation: {
                title: params.title,
                shortDescription: params.shortDescription,
                longDescription: params.longDescription,
                item_category_id: params.categoryId ? params.categoryId : undefined,
                productCode: params.productCode ? params.productCode : undefined
            } as ItemInformationCreateRequest,
            paymentInformation: {
                type: params.saleType,
                itemPrice: {
                    // NOTE: we will generate cryptocurrencyAddress just before posting the message
                    // cryptocurrencyAddress: {
                    //     profile_id: params.profileId,
                    //     type: params.paymentAddressType,
                    //     address: params.paymentAddress
                    // } as CryptocurrencyAddressCreateRequest,
                    currency: params.currency,
                    basePrice: params.basePrice,
                    shippingPrice: {
                        domestic: params.domesticShippingPrice ? params.domesticShippingPrice : 0,
                        international: params.internationalShippingPrice ? params.internationalShippingPrice : 0
                    } as ShippingPriceCreateRequest
                } as ItemPriceCreateRequest,
                escrow: {
                    type: params.escrowType,
                    secondsToLock: 0,
                    releaseType: params.escrowReleaseType,
                    ratio: {
                        buyer: params.buyerRatio,
                        seller: params.sellerRatio
                    } as EscrowRatioCreateRequest
                } as EscrowCreateRequest
            } as PaymentInformationCreateRequest
        } as ListingItemTemplateCreateRequest;

        return createRequest;
    }
}
