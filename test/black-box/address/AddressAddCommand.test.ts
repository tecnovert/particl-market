// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE


import * as resources from 'resources';
import { BlackBoxTestUtil } from '../lib/BlackBoxTestUtil';
import { Commands } from '../../../src/api/commands/CommandEnumType';
import { ShippingCountries } from '../../../src/core/helpers/ShippingCountries';
import { AddressType } from '../../../src/api/enums/AddressType';
import { MissingParamException } from '../../../src/api/exceptions/MissingParamException';
import { InvalidParamException } from '../../../src/api/exceptions/InvalidParamException';
import { CountryCodeNotFoundException } from '../../../src/api/exceptions/CountryCodeNotFoundException';
import { Logger as LoggerType } from '../../../src/core/Logger';

describe('AddressAddCommand', () => {

    jasmine.DEFAULT_TIMEOUT_INTERVAL = +process.env.JASMINE_TIMEOUT;

    const log: LoggerType = new LoggerType(__filename);

    const randomBoolean: boolean = Math.random() >= 0.5;
    const testUtil = new BlackBoxTestUtil(randomBoolean ? 0 : 1);

    const addressCommand = Commands.ADDRESS_ROOT.commandName;
    const addressAddCommand = Commands.ADDRESS_ADD.commandName;

    let profile: resources.Profile;
    let market: resources.Market;

    const testData = {
        title: 'Work',
        firstName: 'Johnny',
        lastName: 'Depp',
        addressLine1: '123 6th St',
        addressLine2: 'Melbourne, FL 32904',
        city: 'Melbourne',
        state: 'Mel State',
        country: 'Finland',
        zipCode: '85001',
        type: AddressType.SHIPPING_OWN
    };

    beforeAll(async () => {
        await testUtil.cleanDb();

        // get default profile and market
        profile = await testUtil.getDefaultProfile();
        expect(profile.id).toBeDefined();
        market = await testUtil.getDefaultMarket(profile.id);
        expect(market.id).toBeDefined();

    });

    test('Should create a new Address for Profile', async () => {
        const res = await testUtil.rpc(addressCommand, [addressAddCommand,
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

        const result: any = res.getBody()['result'];
        expect(result.title).toBe(testData.title);
        expect(result.firstName).toBe(testData.firstName);
        expect(result.lastName).toBe(testData.lastName);
        expect(result.addressLine1).toBe(testData.addressLine1);
        expect(result.addressLine2).toBe(testData.addressLine2);
        expect(result.city).toBe(testData.city);
        expect(result.state).toBe(testData.state);
        expect(result.country).toBe(ShippingCountries.getCountryCode(testData.country));
        expect(result.zipCode).toBe(testData.zipCode);
    });

    test('Should fail because we want to create an empty Address without required fields', async () => {
        const res = await testUtil.rpc(addressCommand, [addressAddCommand,
            profile.id,
            testData.title,
            testData.firstName,
            testData.lastName,
            testData.addressLine1,
            testData.addressLine2,
            testData.city,
            testData.state,
            testData.country
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new MissingParamException('zipCode').getMessage());
    });

    test('Should fail because we want to create an empty Address without required fields', async () => {
        const res = await testUtil.rpc(addressCommand, [addressAddCommand,
            profile.id,
            testData.title,
            testData.firstName,
            testData.lastName,
            testData.addressLine1,
            testData.addressLine2,
            testData.city,
            testData.state
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new MissingParamException('country').getMessage());
    });

    test('Should fail because we want to create an empty Address without required fields', async () => {
        const res = await testUtil.rpc(addressCommand, [addressAddCommand,
            profile.id,
            testData.title,
            testData.firstName,
            testData.lastName,
            testData.addressLine1,
            testData.addressLine2,
            testData.city
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new MissingParamException('state').getMessage());
    });

    test('Should fail because we want to create an empty Address without required fields', async () => {
        const res = await testUtil.rpc(addressCommand, [addressAddCommand,
            profile.id,
            testData.title,
            testData.firstName,
            testData.lastName,
            testData.addressLine1,
            testData.addressLine2
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new MissingParamException('city').getMessage());
    });

    test('Should fail because we want to create an empty Address without required fields', async () => {
        const res = await testUtil.rpc(addressCommand, [addressAddCommand,
            profile.id,
            testData.title,
            testData.firstName,
            testData.lastName,
            testData.addressLine1
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new MissingParamException('addressLine2').getMessage());
    });

        test('Should fail because we want to create an empty Address without required fields', async () => {
        const res = await testUtil.rpc(addressCommand, [addressAddCommand,
            profile.id,
            testData.title,
            testData.firstName,
            testData.lastName
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new MissingParamException('addressLine1').getMessage());
    });

    test('Should fail because we want to create an empty Address without required fields', async () => {
        const res = await testUtil.rpc(addressCommand, [addressAddCommand,
            profile.id,
            testData.title,
            testData.firstName
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new MissingParamException('lastName').getMessage());
    });

    test('Should fail because we want to create an empty Address without required fields', async () => {
        const res = await testUtil.rpc(addressCommand, [addressAddCommand,
            profile.id,
            testData.title
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new MissingParamException('firstName').getMessage());
    });

    test('Should fail because we want to create an empty Address without required fields', async () => {
        const res = await testUtil.rpc(addressCommand, [addressAddCommand,
            profile.id
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new MissingParamException('title').getMessage());
    });

    test('Should fail because we want to create an empty Address without required fields', async () => {
        const res = await testUtil.rpc(addressCommand, [addressAddCommand
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new MissingParamException('profileId').getMessage());
    });

    test('Should fail to create an empty Address because invalid profileId', async () => {
        const res = await testUtil.rpc(addressCommand, [addressAddCommand,
            false,
            testData.title,
            testData.firstName,
            testData.lastName,
            testData.addressLine1,
            testData.addressLine2,
            testData.city,
            testData.state,
            testData.country,
            'test'
        ]);
        res.expectJson();
        res.expectStatusCode(400);
        expect(res.error.error.message).toBe(new InvalidParamException('profileId', 'number').getMessage());
    });

    test('Should fail to create Address because missing state', async () => {
        const res = await testUtil.rpc(addressCommand, [addressAddCommand,
            profile.id,
            testData.title,
            testData.firstName,
            testData.lastName,
            testData.addressLine1,
            testData.addressLine2,
            testData.city,
            undefined,
            testData.country,
            testData.zipCode
        ]);
        res.expectJson();
        res.expectStatusCode(400);
        expect(res.error.error.message).toBe(new InvalidParamException('state', 'string').getMessage());
    });

    test('Should create a new Address with blank state', async () => {
        const res = await testUtil.rpc(addressCommand, [addressAddCommand,
            profile.id,
            testData.title,
            testData.firstName,
            testData.lastName,
            testData.addressLine1,
            testData.addressLine2,
            testData.city,
            '',
            testData.country,
            testData.zipCode
        ]);
        res.expectJson();
        res.expectStatusCode(200);

        const result: any = res.getBody()['result'];
        expect(result.title).toBe(testData.title);
        expect(result.firstName).toBe(testData.firstName);
        expect(result.lastName).toBe(testData.lastName);
        expect(result.addressLine1).toBe(testData.addressLine1);
        expect(result.addressLine2).toBe(testData.addressLine2);
        expect(result.city).toBe(testData.city);
        expect(result.state).toBe('');
        expect(result.country).toBe(ShippingCountries.getCountryCode(testData.country));
        expect(result.zipCode).toBe(testData.zipCode);
    });

    test('Should check countryCode validation', async () => {
        const res = await testUtil.rpc(addressCommand, [addressAddCommand,
            profile.id,
            testData.title,
            testData.firstName,
            testData.lastName,
            testData.addressLine1,
            testData.addressLine2,
            testData.city,
            testData.state,
            'WW',
            testData.zipCode
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new CountryCodeNotFoundException('WW').getMessage());
    });


    test('Should check countryName validation', async () => {
        const res = await testUtil.rpc(addressCommand, [addressAddCommand,
            profile.id,
            testData.title,
            testData.firstName,
            testData.lastName,
            testData.addressLine1,
            testData.addressLine2,
            testData.city,
            testData.state,
            'Atlantida',
            testData.zipCode
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new CountryCodeNotFoundException('ATLANTIDA').getMessage());
    });
});
