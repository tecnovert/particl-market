// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE


import * as resources from 'resources';
import { BlackBoxTestUtil } from '../lib/BlackBoxTestUtil';
import { Commands } from '../../../src/api/commands/CommandEnumType';
import { AddressType } from '../../../src/api/enums/AddressType';
import { Logger as LoggerType } from '../../../src/core/Logger';

describe('AddressListCommand', () => {

    jasmine.DEFAULT_TIMEOUT_INTERVAL = +process.env.JASMINE_TIMEOUT;

    const log: LoggerType = new LoggerType(__filename);

    const randomBoolean: boolean = Math.random() >= 0.5;
    const testUtil = new BlackBoxTestUtil(randomBoolean ? 0 : 1);

    const addressCommand = Commands.ADDRESS_ROOT.commandName;
    const addressListCommand = Commands.ADDRESS_LIST.commandName;
    const addressAddCommand = Commands.ADDRESS_ADD.commandName;

    let profile: resources.Profile;
    let market: resources.Market;

    beforeAll(async () => {
        await testUtil.cleanDb();

        // get default profile and market
        profile = await testUtil.getDefaultProfile(false);
        expect(profile.id).toBeDefined();
        market = await testUtil.getDefaultMarket(profile.id);
        expect(market.id).toBeDefined();

    });

    test('Should list empty address list for default profile id', async () => {
        const res = await testUtil.rpc(addressCommand, [addressListCommand,
            profile.id
        ]);
        res.expectJson();
        res.expectStatusCode(200);
        const result: resources.Address[] = res.getBody()['result'];
        expect(result.length).toBe(0);
    });

    test('Should return code 404 when no profile is given', async () => {
        const res = await testUtil.rpc(addressCommand, [addressListCommand]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.success).toBe(false);
        expect(res.error.error.message).toBe(`Missing profileId.`);
    });

    test('Should list one address for default profile id', async () => {

        const testData = {
            firstName: 'Johnny',
            lastName: 'Depp',
            title: 'Work',
            addressLine1: '123 6th St',
            addressLine2: 'Melbourne, FL 32904',
            city: 'Melbourne',
            state: 'Mel State',
            country: 'Finland',
            zipCode: '85001',
            type: AddressType.SHIPPING_OWN
        };

        let res = await testUtil.rpc(addressCommand, [addressAddCommand,
            profile.id,
            testData.title,
            testData.firstName,
            testData.lastName,
            testData.addressLine1,
            testData.addressLine2,
            testData.city,
            testData.state,
            testData.country,
            testData.zipCode
        ]);
        res.expectJson();
        res.expectStatusCode(200);

        res = await testUtil.rpc(addressCommand, [addressListCommand,
            profile.id
        ]);
        res.expectJson();
        res.expectStatusCode(200);
        const result: resources.Address[] = res.getBody()['result'];
        expect(result.length).toBe(1);

    });

    test('Should list two addresses for default profile id', async () => {

        const testData = {
            firstName: 'Johnny',
            lastName: 'Depp',
            title: 'Work',
            addressLine1: '123 6th St',
            addressLine2: 'Melbourne, FL 32904',
            city: 'Melbourne',
            state: 'Mel State',
            country: 'Finland',
            zipCode: '85001',
            type: AddressType.SHIPPING_OWN
        };

        let res = await testUtil.rpc(addressCommand, [addressAddCommand,
            profile.id,
            testData.title,
            testData.firstName,
            testData.lastName,
            testData.addressLine1,
            testData.addressLine2,
            testData.city,
            testData.state,
            testData.country,
            testData.zipCode
        ]);
        res.expectJson();
        res.expectStatusCode(200);

        // list created addresses
        res = await testUtil.rpc(addressCommand, [addressListCommand,
            profile.id
        ]);
        res.expectJson();
        res.expectStatusCode(200);
        const result: resources.Address[] = res.getBody()['result'];
        expect(result.length).toBe(2);
    });

    test('Should still find the same two addresses after adding SHIPPING_BID type of address', async () => {
        const testDataNotOwn = {
            firstName: 'Johnny',
            lastName: 'Depp',
            title: 'Work',
            addressLine1: '123 6th St',
            addressLine2: 'Melbourne, FL 32904',
            city: 'Melbourne',
            state: 'Mel State',
            country: 'Finland',
            zipCode: '85001',
            type: AddressType.SHIPPING_BID
        };

        let res = await testUtil.rpc(addressCommand, [addressAddCommand,
            profile.id,
            testDataNotOwn.title,
            testDataNotOwn.firstName,
            testDataNotOwn.lastName,
            testDataNotOwn.addressLine1,
            testDataNotOwn.addressLine2,
            testDataNotOwn.city,
            testDataNotOwn.state,
            testDataNotOwn.country,
            testDataNotOwn.zipCode,
            testDataNotOwn.type
        ]);
        res.expectJson();
        res.expectStatusCode(200);

        res = await testUtil.rpc(addressCommand, [addressListCommand,
            profile.id
        ]);
        res.expectJson();
        res.expectStatusCode(200);
        const result: resources.Address[] = res.getBody()['result'];
        expect(result.length).toBe(2);

        res = await testUtil.rpc(addressCommand, [addressListCommand,
            profile.id,
            AddressType.SHIPPING_OWN
        ]);
        res.expectJson();
        res.expectStatusCode(200);
        const resultOrder: resources.Address[] = res.getBody()['result'];
        expect(resultOrder.length).toBe(2);
    });

});
