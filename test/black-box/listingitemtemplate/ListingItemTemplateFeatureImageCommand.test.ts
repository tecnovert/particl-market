// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * from 'jest';
import * as resources from 'resources';
import { BlackBoxTestUtil } from '../lib/BlackBoxTestUtil';
import { CreatableModel } from '../../../src/api/enums/CreatableModel';
import { Commands } from '../../../src/api/commands/CommandEnumType';
import { Logger as LoggerType } from '../../../src/core/Logger';
import { InvalidParamException } from '../../../src/api/exceptions/InvalidParamException';
import { GenerateListingItemTemplateParams } from '../../../src/api/requests/testdata/GenerateListingItemTemplateParams';
import { MissingParamException } from '../../../src/api/exceptions/MissingParamException';
import { ModelNotModifiableException } from '../../../src/api/exceptions/ModelNotModifiableException';


describe('ListingItemTemplateFeatureImageCommand', () => {

    jasmine.DEFAULT_TIMEOUT_INTERVAL = process.env.JASMINE_TIMEOUT;

    const log: LoggerType = new LoggerType(__filename);

    const randomBoolean: boolean = Math.random() >= 0.5;
    const testUtil = new BlackBoxTestUtil(randomBoolean ? 0 : 1);

    const templateCommand = Commands.TEMPLATE_ROOT.commandName;
    const featuredImageCommand = Commands.TEMPLATE_FEATURED_IMAGE.commandName;

    let listingItemTemplate: resources.ListingItemTemplate;
    let postedListingItemTemplate: resources.ListingItemTemplate;

    let profile: resources.Profile;
    let market: resources.Market;

    beforeAll(async () => {
        await testUtil.cleanDb();

        // get default profile and market
        profile = await testUtil.getDefaultProfile();
        market = await testUtil.getDefaultMarket(profile.id);

        let generateListingItemTemplateParams = new GenerateListingItemTemplateParams([
            true,           // generateItemInformation
            true,           // generateItemLocation
            true,           // generateShippingDestinations
            true,           // generateImages
            true,           // generatePaymentInformation
            true,           // generateEscrow
            true,           // generateItemPrice
            true,           // generateMessagingInformation
            false,          // generateListingItemObjects
            false,          // generateObjectDatas
            profile.id,     // profileId
            false,          // generateListingItem
            market.id       // marketId
        ]).toParamsArray();

        let listingItemTemplates = await testUtil.generateData(
            CreatableModel.LISTINGITEMTEMPLATE, // what to generate
            1,                          // how many to generate
            true,                    // return model
            generateListingItemTemplateParams   // what kind of data to generate
        ) as resources.ListingItemTemplate[];
        listingItemTemplate = listingItemTemplates[0];

        generateListingItemTemplateParams = new GenerateListingItemTemplateParams([
            true,           // generateItemInformation
            true,           // generateItemLocation
            true,           // generateShippingDestinations
            true,           // generateImages
            true,           // generatePaymentInformation
            true,           // generateEscrow
            true,           // generateItemPrice
            true,           // generateMessagingInformation
            false,          // generateListingItemObjects
            false,          // generateObjectDatas
            profile.id,     // profileId
            true,           // generateListingItem
            market.id       // marketId
        ]).toParamsArray();

        listingItemTemplates = await testUtil.generateData(
            CreatableModel.LISTINGITEMTEMPLATE, // what to generate
            1,                          // how many to generate
            true,                    // return model
            generateListingItemTemplateParams   // what kind of data to generate
        ) as resources.ListingItemTemplate[];
        postedListingItemTemplate = listingItemTemplates[0];

    });

    test('Should fail to set featured because missing listingItemTemplateId', async () => {
        const res: any = await testUtil.rpc(templateCommand, [featuredImageCommand]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new MissingParamException('listingItemTemplateId').getMessage());
    });

    test('Should fail to set featured because missing imageId', async () => {
        const res: any = await testUtil.rpc(templateCommand, [featuredImageCommand,
            listingItemTemplate.id
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new MissingParamException('imageId').getMessage());
    });

    test('Should fail to set featured because invalid listingItemTemplateId', async () => {
        const res: any = await testUtil.rpc(templateCommand, [featuredImageCommand,
            'INVALID',
            listingItemTemplate.ItemInformation.Images[0].id
        ]);
        res.expectJson();
        res.expectStatusCode(400);
        expect(res.error.error.message).toBe(new InvalidParamException('listingItemTemplateId', 'number').getMessage());
    });

    test('Should fail to set featured because invalid imageId', async () => {
        const res: any = await testUtil.rpc(templateCommand, [featuredImageCommand,
            listingItemTemplate.id,
            'INVALID'
        ]);
        res.expectJson();
        res.expectStatusCode(400);
        expect(res.error.error.message).toBe(new InvalidParamException('imageId', 'number').getMessage());
    });

    test('Should set the featured flag on Image', async () => {
        // log.debug('listingItemTemplate', JSON.stringify(listingItemTemplate, null, 2));
        const res = await testUtil.rpc(templateCommand, [featuredImageCommand,
            listingItemTemplate.id,
            listingItemTemplate.ItemInformation.Images[0].id
        ]);
        res.expectJson();
        res.expectStatusCode(200);

        const result: resources.Image = res.getBody()['result'];
        expect(result.id).toBe(listingItemTemplate.ItemInformation.Images[0].id);
        expect(result.featured).toBeTruthy();
    });

    test('Should fail to set featured because ListingItemTemplate is already posted', async () => {
        const res: any = await testUtil.rpc(templateCommand, [featuredImageCommand,
            postedListingItemTemplate.id,
            postedListingItemTemplate.ItemInformation.Images[0].id
        ]);
        res.expectJson();
        res.expectStatusCode(400);
        expect(res.error.error.message).toBe(new ModelNotModifiableException('ListingItemTemplate').getMessage());
    });

});


