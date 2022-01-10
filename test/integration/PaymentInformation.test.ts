// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * from 'jest';
import * as resources from 'resources';
import * as _ from 'lodash';
import * as Faker from 'faker';
import { app } from '../../src/app';
import { Logger as LoggerType } from '../../src/core/Logger';
import { Targets, Types } from '../../src/constants';
import { TestUtil } from './lib/TestUtil';
import { TestDataService } from '../../src/api/services/TestDataService';
import { ProfileService } from '../../src/api/services/model/ProfileService';
import { ListingItemTemplateService } from '../../src/api/services/model/ListingItemTemplateService';
import { PaymentInformationService } from '../../src/api/services/model/PaymentInformationService';
import { EscrowService } from '../../src/api/services/model/EscrowService';
import { ItemPriceService } from '../../src/api/services/model/ItemPriceService';
import { ValidationException } from '../../src/api/exceptions/ValidationException';
import { NotFoundException } from '../../src/api/exceptions/NotFoundException';
import { PaymentInformationCreateRequest } from '../../src/api/requests/model/PaymentInformationCreateRequest';
import { PaymentInformationUpdateRequest } from '../../src/api/requests/model/PaymentInformationUpdateRequest';
import { EscrowReleaseType, EscrowType, SaleType } from 'omp-lib/dist/interfaces/omp-enums';
import { CryptoAddressType, Cryptocurrency } from 'omp-lib/dist/interfaces/crypto';
import { ItemPriceCreateRequest } from '../../src/api/requests/model/ItemPriceCreateRequest';
import { EscrowCreateRequest } from '../../src/api/requests/model/EscrowCreateRequest';
import { EscrowRatioCreateRequest } from '../../src/api/requests/model/EscrowRatioCreateRequest';
import { EscrowUpdateRequest } from '../../src/api/requests/model/EscrowUpdateRequest';
import { ItemPriceUpdateRequest } from '../../src/api/requests/model/ItemPriceUpdateRequest';
import { EscrowRatioUpdateRequest } from '../../src/api/requests/model/EscrowRatioUpdateRequest';
import { GenerateListingItemTemplateParams } from '../../src/api/requests/testdata/GenerateListingItemTemplateParams';
import { CreatableModel } from '../../src/api/enums/CreatableModel';
import { TestDataGenerateRequest } from '../../src/api/requests/testdata/TestDataGenerateRequest';
import { MarketService } from '../../src/api/services/model/MarketService';
import { DefaultMarketService } from '../../src/api/services/DefaultMarketService';
import { toSatoshis } from 'omp-lib/dist/util';
import { ShippingPriceCreateRequest } from '../../src/api/requests/model/ShippingPriceCreateRequest';
import { CryptocurrencyAddressCreateRequest } from '../../src/api/requests/model/CryptocurrencyAddressCreateRequest';

describe('PaymentInformation', () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = process.env.JASMINE_TIMEOUT;

    const log: LoggerType = new LoggerType(__filename);
    const testUtil = new TestUtil();

    let testDataService: TestDataService;
    let defaultMarketService: DefaultMarketService;
    let paymentInformationService: PaymentInformationService;
    let profileService: ProfileService;
    let marketService: MarketService;
    let listingItemTemplateService: ListingItemTemplateService;
    let escrowService: EscrowService;
    let itemPriceService: ItemPriceService;

    let paymentInformation: resources.PaymentInformation;
    let listingItemTemplate: resources.ListingItemTemplate;
    let market: resources.Market;
    let profile: resources.Profile;

    const testData = {
        type: SaleType.SALE,
        escrow: {
            type: EscrowType.MAD,
            ratio: {
                buyer: 100,
                seller: 100
            } as EscrowRatioCreateRequest,
            secondsToLock: 30,
            releaseType: EscrowReleaseType.ANON
        } as EscrowCreateRequest,
        itemPrice: {
            currency: Cryptocurrency.PART,
            basePrice: toSatoshis(+_.random(0.1, 1.00).toFixed(8)),
            shippingPrice: {
                domestic: toSatoshis(+_.random(0.01, 0.10).toFixed(8)),
                international: toSatoshis(+_.random(0.10, 0.20).toFixed(8))
            } as ShippingPriceCreateRequest,
            cryptocurrencyAddress: {
                type: CryptoAddressType.STEALTH,
                address: Faker.finance.bitcoinAddress()
            } as CryptocurrencyAddressCreateRequest
        } as ItemPriceCreateRequest
    } as PaymentInformationCreateRequest;

    const testDataUpdated = {
        type: SaleType.FREE,
        escrow: {
            type: EscrowType.FE,
            ratio: {
                buyer: 0,
                seller: 0
            } as EscrowRatioUpdateRequest,
            secondsToLock: 30,
            releaseType: EscrowReleaseType.ANON
        } as EscrowUpdateRequest,
        itemPrice: {
            currency: Cryptocurrency.BTC,
            basePrice: toSatoshis(+_.random(0.1, 1.00).toFixed(8)),
            shippingPrice: {
                domestic: toSatoshis(+_.random(0.01, 0.10).toFixed(8)),
                international: toSatoshis(+_.random(0.10, 0.20).toFixed(8))
            } as ShippingPriceCreateRequest,
            cryptocurrencyAddress: {
                type: CryptoAddressType.STEALTH,
                address: Faker.finance.bitcoinAddress()
            } as CryptocurrencyAddressCreateRequest
        } as ItemPriceUpdateRequest
    } as PaymentInformationUpdateRequest;

    beforeAll(async () => {
        await testUtil.bootstrapAppContainer(app);  // bootstrap the app

        testDataService = app.IoC.getNamed<TestDataService>(Types.Service, Targets.Service.TestDataService);
        defaultMarketService = app.IoC.getNamed<DefaultMarketService>(Types.Service, Targets.Service.DefaultMarketService);
        paymentInformationService = app.IoC.getNamed<PaymentInformationService>(Types.Service, Targets.Service.model.PaymentInformationService);
        profileService = app.IoC.getNamed<ProfileService>(Types.Service, Targets.Service.model.ProfileService);
        marketService = app.IoC.getNamed<MarketService>(Types.Service, Targets.Service.model.MarketService);
        listingItemTemplateService = app.IoC.getNamed<ListingItemTemplateService>(Types.Service, Targets.Service.model.ListingItemTemplateService);
        escrowService = app.IoC.getNamed<EscrowService>(Types.Service, Targets.Service.model.EscrowService);
        itemPriceService = app.IoC.getNamed<ItemPriceService>(Types.Service, Targets.Service.model.ItemPriceService);

        profile = await profileService.getDefault().then(value => value.toJSON());
        market = await defaultMarketService.getDefaultForProfile(profile.id).then(value => value.toJSON());

        const generateListingItemTemplateParams = new GenerateListingItemTemplateParams([
            true,               // generateItemInformation
            true,               // generateItemLocation
            true,               // generateShippingDestinations
            false,              // generateImages
            false,              // generatePaymentInformation
            false,              // generateEscrow
            false,              // generateItemPrice
            false,              // generateMessagingInformation
            false,              // generateListingItemObjects
            false,              // generateObjectDatas
            profile.id,         // profileId
            false,              // generateListingItem
            market.id           // soldOnMarketId
        ]).toParamsArray();

        const listingItemTemplates: resources.ListingItemTemplate[] = await testDataService.generate({
            model: CreatableModel.LISTINGITEMTEMPLATE,          // what to generate
            amount: 1,                                          // how many to generate
            withRelated: true,                                  // return model
            generateParams: generateListingItemTemplateParams   // what kind of data to generate
        } as TestDataGenerateRequest);

        listingItemTemplate = listingItemTemplates[0];
    });

    afterAll(async () => {
        //
    });

    test('Should throw ValidationException because we want to create a empty PaymentInformation', async () => {
        expect.assertions(1);
        await paymentInformationService.create({} as PaymentInformationCreateRequest).catch(e =>
            expect(e).toEqual(new ValidationException('Request body is not valid', []))
        );
    });

    test('Should throw ValidationException because there is no listing_item_id or listing_item_template_id', async () => {
        expect.assertions(1);
        await paymentInformationService.create({
            type: SaleType.SALE
        } as PaymentInformationCreateRequest).catch(e =>
            expect(e).toEqual(new ValidationException('Request body is not valid', []))
        );
    });

    test('Should create a new PaymentInformation', async () => {
        testData.listing_item_template_id = listingItemTemplate.id;
        const result: resources.PaymentInformation = await paymentInformationService.create(testData).then(value => value.toJSON());

        expect(result.type).toBe(testData.type);
        expect(result.Escrow.type).toBe(testData.escrow.type);
        expect(result.Escrow.Ratio.buyer).toBe(testData.escrow.ratio.buyer);
        expect(result.Escrow.Ratio.seller).toBe(testData.escrow.ratio.seller);
        expect(result.ItemPrice.currency).toBe(testData.itemPrice.currency);
        expect(result.ItemPrice.basePrice).toBe(testData.itemPrice.basePrice);

        paymentInformation = result;
    });

    test('Should list PaymentInformations with our new create one', async () => {
        const paymentInformations: resources.PaymentInformation[] = await paymentInformationService.findAll().then(value => value.toJSON());
        expect(paymentInformations.length).toBe(1);

        const result = paymentInformations[0];
        expect(result.type).toBe(testData.type); // findall doesnt return relations by default
    });

    test('Should return one PaymentInformation', async () => {
        paymentInformation = await paymentInformationService.findOne(paymentInformation.id).then(value => value.toJSON());

        const result: resources.PaymentInformation = paymentInformation;
        expect(result.type).toBe(testData.type);
        expect(result.Escrow.type).toBe(testData.escrow.type);
        expect(result.Escrow.Ratio.buyer).toBe(testData.escrow.ratio.buyer);
        expect(result.Escrow.Ratio.seller).toBe(testData.escrow.ratio.seller);
        expect(result.ItemPrice.currency).toBe(testData.itemPrice.currency);
        expect(result.ItemPrice.basePrice).toBe(testData.itemPrice.basePrice);
    });

    test('Should update the PaymentInformation', async () => {
        paymentInformation = await paymentInformationService.update(paymentInformation.id, testDataUpdated).then(value => value.toJSON());

        const result: resources.PaymentInformation = paymentInformation;
        expect(result.type).toBe(testDataUpdated.type);
        expect(result.Escrow.type).toBe(testDataUpdated.escrow.type);
        expect(result.Escrow.Ratio.buyer).toBe(testDataUpdated.escrow.ratio.buyer);
        expect(result.Escrow.Ratio.seller).toBe(testDataUpdated.escrow.ratio.seller);
        expect(result.ItemPrice.currency).toBe(testDataUpdated.itemPrice.currency);
        expect(result.ItemPrice.basePrice).toBe(testDataUpdated.itemPrice.basePrice);
    });

    test('Should delete the PaymentInformation', async () => {
        expect.assertions(3);
        await paymentInformationService.destroy(paymentInformation.id);
        await paymentInformationService.findOne(paymentInformation.id).catch(e =>
            expect(e).toEqual(new NotFoundException(paymentInformation.id))
        );

        // findout escrow
        await escrowService.findOne(paymentInformation.Escrow.id).catch(e =>
            expect(e).toEqual(new NotFoundException(paymentInformation.Escrow.id))
        );
        // findout itemPrice
        await itemPriceService.findOne(paymentInformation.ItemPrice.id).catch(e =>
            expect(e).toEqual(new NotFoundException(paymentInformation.ItemPrice.id))
        );
    });

});
