// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * from 'jest';
import * as resources from 'resources';
import { app } from '../../src/app';
import { Logger as LoggerType } from '../../src/core/Logger';
import { Types, Core, Targets } from '../../src/constants';
import { TestUtil } from './lib/TestUtil';
import { TestDataService } from '../../src/api/services/TestDataService';
import { ProfileService } from '../../src/api/services/model/ProfileService';
import { ListingItemTemplateService } from '../../src/api/services/model/ListingItemTemplateService';
import { ListingItemObjectService } from '../../src/api/services/model/ListingItemObjectService';
import { ListingItemObjectDataService } from '../../src/api/services/model/ListingItemObjectDataService';
import { ValidationException } from '../../src/api/exceptions/ValidationException';
import { NotFoundException } from '../../src/api/exceptions/NotFoundException';
import { ListingItemObject } from '../../src/api/models/ListingItemObject';
import { ListingItemObjectType } from '../../src/api/enums/ListingItemObjectType';
import { ListingItemObjectCreateRequest } from '../../src/api/requests/model/ListingItemObjectCreateRequest';
import { ListingItemObjectUpdateRequest } from '../../src/api/requests/model/ListingItemObjectUpdateRequest';
import { MarketService } from '../../src/api/services/model/MarketService';
import { DefaultMarketService } from '../../src/api/services/DefaultMarketService';

describe('ListingItemObject', () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = process.env.JASMINE_TIMEOUT;

    const log: LoggerType = new LoggerType(__filename);
    const testUtil = new TestUtil();

    let testDataService: TestDataService;
    let defaultMarketService: DefaultMarketService;
    let listingItemObjectService: ListingItemObjectService;
    let marketService: MarketService;
    let profileService: ProfileService;
    let listingItemTemplateService: ListingItemTemplateService;
    let listingItemObjectDataService: ListingItemObjectDataService;

    let bidderProfile: resources.Profile;
    let bidderMarket: resources.Market;
    let sellerProfile: resources.Profile;
    let sellerMarket: resources.Market;

    let listingItem: resources.ListingItem;
    let listingItemTemplate: resources.ListingItemTemplate;
    let listingItemObject: resources.ListingItemObject;

    const testData = {
        type: ListingItemObjectType.DROPDOWN,
        description: 'where to store the dropdown data...',
        order: 0,
        listingItemObjectDatas: [{
            key: 'gps',
            value: 'NVIDIA 500'
        }]
    } as ListingItemObjectCreateRequest;

    const testDataUpdated = {
        type: ListingItemObjectType.TABLE,
        description: 'table desc',
        order: 1
    } as ListingItemObjectUpdateRequest;


    beforeAll(async () => {
        await testUtil.bootstrapAppContainer(app);  // bootstrap the app

        testDataService = app.IoC.getNamed<TestDataService>(Types.Service, Targets.Service.TestDataService);
        defaultMarketService = app.IoC.getNamed<DefaultMarketService>(Types.Service, Targets.Service.DefaultMarketService);
        listingItemObjectService = app.IoC.getNamed<ListingItemObjectService>(Types.Service, Targets.Service.model.ListingItemObjectService);
        listingItemObjectDataService = app.IoC.getNamed<ListingItemObjectDataService>(Types.Service, Targets.Service.model.ListingItemObjectDataService);
        marketService = app.IoC.getNamed<MarketService>(Types.Service, Targets.Service.model.MarketService);
        profileService = app.IoC.getNamed<ProfileService>(Types.Service, Targets.Service.model.ProfileService);
        listingItemTemplateService = app.IoC.getNamed<ListingItemTemplateService>(Types.Service, Targets.Service.model.ListingItemTemplateService);

        // get default profile + market
        bidderProfile = await profileService.getDefault().then(value => value.toJSON());
        bidderMarket = await defaultMarketService.getDefaultForProfile(bidderProfile.id).then(value => value.toJSON());

        bidderProfile = await profileService.getDefault().then(value => value.toJSON());
        bidderMarket = await defaultMarketService.getDefaultForProfile(bidderProfile.id).then(value => value.toJSON());

        sellerProfile = await testDataService.generateProfile();
        sellerMarket = await defaultMarketService.getDefaultForProfile(sellerProfile.id).then(value => value.toJSON());

        listingItem = await testDataService.generateListingItemWithTemplate(sellerProfile, bidderMarket);
        listingItemTemplate = await listingItemTemplateService.findOne(listingItem.ListingItemTemplate.id).then(value => value.toJSON());

    });

    afterAll(async () => {
        //
    });

    test('Should throw ValidationException because we want to create a empty messaging information', async () => {
        expect.assertions(1);
        await listingItemObjectService.create({} as ListingItemObjectCreateRequest).catch(e =>
            expect(e).toEqual(new ValidationException('Request body is not valid', []))
        );
    });

    test('Should create a new ListingItemObject', async () => {
        testData.listing_item_template_id = listingItemTemplate.id;

        const result: resources.ListingItemObject = await listingItemObjectService.create(testData).then(value => value.toJSON());

        expect(result.type).toBe(testData.type);
        expect(result.description).toBe(testData.description);
        expect(result.order).toBe(testData.order);
        expect(result.forceInput).toBe(0);
        expect(result.objectId).toBeNull();

        expect(result.ListingItemObjectDatas[0].key).toBe(testData.listingItemObjectDatas[0].key);
        expect(result.ListingItemObjectDatas[0].value).toBe(testData.listingItemObjectDatas[0].value);

        listingItemObject = result;
    });

    test('Should throw ValidationException because we want to create a empty ListingItemObject', async () => {
        expect.assertions(1);
        await listingItemObjectService.create({} as ListingItemObjectCreateRequest).catch(e =>
            expect(e).toEqual(new ValidationException('Request body is not valid', []))
        );
    });

    test('Should list all ListingItemObjects with our new create one', async () => {
        const listingItemObjects: resources.ListingItemObject[] = await listingItemObjectService.findAll().then(value => value.toJSON());
        expect(listingItemObjects.length).toBe(1);

        const result = listingItemObjects[0];

        expect(result.type).toBe(testData.type);
        expect(result.description).toBe(testData.description);
        expect(result.order).toBe(testData.order);
        expect(result.forceInput).toBe(0);
        expect(result.objectId).toBeNull();
    });

    test('Should return one ListingItemObject', async () => {
        const result: resources.ListingItemObject = await listingItemObjectService.findOne(listingItemObject.id).then(value => value.toJSON());

        expect(result.type).toBe(testData.type);
        expect(result.description).toBe(testData.description);
        expect(result.order).toBe(testData.order);
        expect(result.forceInput).toBe(0);
        expect(result.objectId).toBeNull();
        expect(result.ListingItemObjectDatas[0].key).toBe(testData.listingItemObjectDatas[0].key);
        expect(result.ListingItemObjectDatas[0].value).toBe(testData.listingItemObjectDatas[0].value);
    });

    test('Should update the ListingItemObject', async () => {
        const result: resources.ListingItemObject = await listingItemObjectService.update(listingItemObject.id, testDataUpdated)
            .then(value => value.toJSON());

        expect(result.type).toBe(testDataUpdated.type);
        expect(result.description).toBe(testDataUpdated.description);
        expect(result.order).toBe(testDataUpdated.order);
    });

    test('Should delete the ListingItemObject', async () => {
        expect.assertions(2);
        await listingItemObjectService.destroy(listingItemObject.id);
        await listingItemObjectService.findOne(listingItemObject.id).catch(e =>
            expect(e).toEqual(new NotFoundException(listingItemObject.id))
        );

        await listingItemObjectDataService.findOne(listingItemObject.ListingItemObjectDatas[0].id).catch(e =>
           expect(e).toEqual(new NotFoundException(listingItemObject.ListingItemObjectDatas[0].id))
        );
    });

});
