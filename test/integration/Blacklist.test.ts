// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * from 'jest';
import * as resources from 'resources';
import * as Faker from 'faker';
import { app } from '../../src/app';
import { Logger as LoggerType } from '../../src/core/Logger';
import { Types, Core, Targets } from '../../src/constants';
import { TestUtil } from './lib/TestUtil';
import { TestDataService } from '../../src/api/services/TestDataService';
import { NotFoundException } from '../../src/api/exceptions/NotFoundException';
import { Blacklist } from '../../src/api/models/Blacklist';
import { BlacklistService } from '../../src/api/services/model/BlacklistService';
import { BlacklistCreateRequest } from '../../src/api/requests/model/BlacklistCreateRequest';
import { BlacklistUpdateRequest } from '../../src/api/requests/model/BlacklistUpdateRequest';
import { BlacklistType } from '../../src/api/enums/BlacklistType';


describe('Blacklist', () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = process.env.JASMINE_TIMEOUT;

    const log: LoggerType = new LoggerType(__filename);
    const testUtil = new TestUtil();

    let testDataService: TestDataService;
    let blacklistService: BlacklistService;

    let blacklist: resources.Blacklist;

    const testData = {
        type: BlacklistType.LISTINGITEM,
        target: Faker.random.uuid(),
        market: Faker.random.uuid()
        // profile_id,
        // listing_item_id
    } as BlacklistCreateRequest;

    const testDataUpdated = {
        type: BlacklistType.LISTINGITEM,
        target: Faker.random.uuid(),
        market: Faker.random.uuid()
    } as BlacklistUpdateRequest;

    beforeAll(async () => {
        await testUtil.bootstrapAppContainer(app);  // bootstrap the app

        testDataService = app.IoC.getNamed<TestDataService>(Types.Service, Targets.Service.TestDataService);
        blacklistService = app.IoC.getNamed<BlacklistService>(Types.Service, Targets.Service.model.BlacklistService);
    });

    afterAll(async () => {
        //
    });

    test('Should create a new blacklist', async () => {
        blacklist = await blacklistService.create(testData).then(value => value.toJSON());
        const result: resources.Blacklist = blacklist;

        // expect(result.value).toBe(testData.value);
        expect(result.type).toBe(testData.type);
        expect(result.target).toBe(testData.target);
        expect(result.market).toBe(testData.market);
    });

    test('Should list Blacklists with our new create one', async () => {
        const blacklists: resources.Blacklist[] = await blacklistService.findAll()
            .then(value => value.toJSON());
        expect(blacklists.length).toBe(1);
    });

    test('Should list blacklists with our new create one', async () => {
        const blacklists: resources.Blacklist[] = await blacklistService.findAll().then(value => value.toJSON());
        expect(blacklists.length).toBe(1);

        const result = blacklists[0];
        expect(result.type).toBe(testData.type);
        expect(result.target).toBe(testData.target);
        expect(result.market).toBe(testData.market);
    });

    test('Should list blacklists by type with our new create one', async () => {
        const blacklists: resources.Blacklist[] = await blacklistService.findAllByType(testData.type).then(value => value.toJSON());
        expect(blacklists.length).toBe(1);

        const result = blacklists[0];
        expect(result.type).toBe(testData.type);
        expect(result.target).toBe(testData.target);
        expect(result.market).toBe(testData.market);
    });

    test('Should return one blacklist', async () => {
        const result: resources.Blacklist = await blacklistService.findOne(blacklist.id).then(value => value.toJSON());
        expect(result.type).toBe(testData.type);
        expect(result.target).toBe(testData.target);
        expect(result.market).toBe(testData.market);
    });

    test('Should update the blacklist', async () => {
        const result: resources.Blacklist = await blacklistService.update(blacklist.id, testDataUpdated).then(value => value.toJSON());
        expect(result.type).toBe(testDataUpdated.type);
        expect(result.target).toBe(testDataUpdated.target);
    });

    test('Should delete the Blacklist', async () => {
        expect.assertions(1);
        await blacklistService.destroy(blacklist.id);
        await blacklistService.findOne(blacklist.id).catch(e =>
            expect(e).toEqual(new NotFoundException(blacklist.id))
        );
    });

});
