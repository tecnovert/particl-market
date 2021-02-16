// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * from 'jest';
import { app } from '../../src/app';
import { Logger as LoggerType } from '../../src/core/Logger';
import { Types, Core, Targets } from '../../src/constants';
import { TestUtil } from './lib/TestUtil';
import { TestDataService } from '../../src/api/services/TestDataService';
import { ValidationException } from '../../src/api/exceptions/ValidationException';
import { NotFoundException } from '../../src/api/exceptions/NotFoundException';
import { CryptocurrencyAddress } from '../../src/api/models/CryptocurrencyAddress';
import { CryptocurrencyAddressService } from '../../src/api/services/model/CryptocurrencyAddressService';
import { ProfileService } from '../../src/api/services/model/ProfileService';
import { CryptocurrencyAddressCreateRequest } from '../../src/api/requests/model/CryptocurrencyAddressCreateRequest';
import { CryptocurrencyAddressUpdateRequest } from '../../src/api/requests/model/CryptocurrencyAddressUpdateRequest';
import { CryptoAddressType } from 'omp-lib/dist/interfaces/crypto';

describe('CryptocurrencyAddress', () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = process.env.JASMINE_TIMEOUT;

    const log: LoggerType = new LoggerType(__filename);
    const testUtil = new TestUtil();

    let testDataService: TestDataService;
    let cryptocurrencyAddressService: CryptocurrencyAddressService;
    let profileService: ProfileService;

    let createdId;
    // let createdListingItemTemplate;

    let defaultProfile;

    const testData = {
        profile_id: 0,
        type: CryptoAddressType.NORMAL,
        address: '123'
    } as CryptocurrencyAddressCreateRequest;

    const testDataUpdated = {
        profile_id: 0,
        type: CryptoAddressType.STEALTH,
        address: '456'
    } as CryptocurrencyAddressUpdateRequest;

    beforeAll(async () => {
        await testUtil.bootstrapAppContainer(app);  // bootstrap the app

        testDataService = app.IoC.getNamed<TestDataService>(Types.Service, Targets.Service.TestDataService);
        cryptocurrencyAddressService = app.IoC.getNamed<CryptocurrencyAddressService>(Types.Service, Targets.Service.model.CryptocurrencyAddressService);
        profileService = app.IoC.getNamed<ProfileService>(Types.Service, Targets.Service.model.ProfileService);

        defaultProfile = await profileService.getDefault().then(value => value.toJSON());
    });

    test('Should create a new cryptocurrency address related to profile', async () => {

        // profile id to testData
        testData.profile_id = defaultProfile.id;

        const cryptocurrencyAddress: CryptocurrencyAddress = await cryptocurrencyAddressService.create(testData);
        createdId = cryptocurrencyAddress.Id;
        const result = cryptocurrencyAddress.toJSON();

        expect(result.type).toBe(testData.type);
        expect(result.address).toBe(testData.address);
    });

    test('Should create a new cryptocurrency address without a link to a profile', async () => {
        const cryptocurrencyAddress: CryptocurrencyAddress = await cryptocurrencyAddressService.create(testData);
        const result = cryptocurrencyAddress.toJSON();
        expect(result.type).toBe(testData.type);
        expect(result.address).toBe(testData.address);
    });

    test('Should throw ValidationException because we want to create a empty cryptocurrency address', async () => {
        expect.assertions(1);
        await cryptocurrencyAddressService.create({} as CryptocurrencyAddressCreateRequest)
            .catch(e =>
                expect(e).toEqual(new ValidationException('Request body is not valid', []))
            );
    });

    test('Should list cryptocurrency addresses with our new create one', async () => {
        const cryptocurrencyAddressCollection = await cryptocurrencyAddressService.findAll();
        const cryptocurrencyAddress = cryptocurrencyAddressCollection.toJSON();
        expect(cryptocurrencyAddress.length).toBe(2);

        const result = cryptocurrencyAddress[0];

        expect(result.type).toBe(testData.type);
        expect(result.address).toBe(testData.address);
    });

    test('Should return one cryptocurrency address', async () => {
        const cryptocurrencyAddressModel: CryptocurrencyAddress = await cryptocurrencyAddressService.findOne(createdId);
        const result = cryptocurrencyAddressModel.toJSON();

        expect(result.type).toBe(testData.type);
        expect(result.address).toBe(testData.address);
    });

    test('Should update the cryptocurrency address', async () => {
        testDataUpdated.profile_id = defaultProfile.id;
        const cryptocurrencyAddressModel: CryptocurrencyAddress = await cryptocurrencyAddressService.update(createdId, testDataUpdated);
        const result = cryptocurrencyAddressModel.toJSON();

        expect(result.type).toBe(testDataUpdated.type);
        expect(result.address).toBe(testDataUpdated.address);
    });

    test('Should delete the cryptocurrency address', async () => {
        expect.assertions(1);
        await cryptocurrencyAddressService.destroy(createdId);
        await cryptocurrencyAddressService.findOne(createdId).catch(e =>
            expect(e).toEqual(new NotFoundException(createdId))
        );
    });

});
