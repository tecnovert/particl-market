// Copyright (c) 2017-2023, The Particl Market developers
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
import { Address } from '../../src/api/models/Address';
import { AddressCreateRequest } from '../../src/api/requests/model/AddressCreateRequest';
import { AddressUpdateRequest } from '../../src/api/requests/model/AddressUpdateRequest';
import { AddressService } from '../../src/api/services/model/AddressService';
import { ProfileService } from '../../src/api/services/model/ProfileService';
import { AddressType } from '../../src/api/enums/AddressType';

describe('Address', () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = process.env.JASMINE_TIMEOUT;

    const log: LoggerType = new LoggerType(__filename);
    const testUtil = new TestUtil();

    let testDataService: TestDataService;
    let addressService: AddressService;
    let profileService: ProfileService;

    let createdId;
    let defaultProfileId;

    const testData = {
        title: 'Title',
        firstName: 'Robert',
        lastName: 'Downey',
        addressLine1: 'Add',
        addressLine2: 'ADD 22',
        city: 'city',
        state: 'test state',
        country: 'Finland',
        zipCode: '85001',
        profile_id: 0,
        type: AddressType.SHIPPING_OWN
    } as AddressCreateRequest;

    const testDataUpdated = {
        firstName: 'Johnny',
        lastName: 'Depp',
        title: 'Work',
        addressLine1: '123 6th St',
        addressLine2: 'Melbourne, FL 32904',
        city: 'Melbourne',
        state: 'test state',
        country: 'Sweden',
        zipCode: '85001'
    } as AddressUpdateRequest;

    beforeAll(async () => {
        await testUtil.bootstrapAppContainer(app);  // bootstrap the app

        testDataService = app.IoC.getNamed<TestDataService>(Types.Service, Targets.Service.TestDataService);
        addressService = app.IoC.getNamed<AddressService>(Types.Service, Targets.Service.model.AddressService);
        profileService = app.IoC.getNamed<ProfileService>(Types.Service, Targets.Service.model.ProfileService);

        const defaultProfile = await profileService.getDefault();
        defaultProfileId = defaultProfile.id;
    });


    test('Should throw ValidationException because there is no profile_id', async () => {
        expect.assertions(1);
        await addressService.create({
            title: 'Title',
            addressLine1: 'Add',
            addressLine2: 'ADD 22',
            city: 'city',
            state: 'test state',
            country: 'Finland',
            zipCode: '85001'
        } as AddressCreateRequest).catch(e => {
            expect(e).toEqual(new ValidationException('Request body is not valid', []));
        });
    });

    test('Should create a new address', async () => {
        testData.profile_id = defaultProfileId;
        const addressModel: Address = await addressService.create(testData);
        createdId = addressModel.Id;

        const result = addressModel.toJSON();
        expect(result.title).toBe(testData.title);
        expect(result.addressLine1).toBe(testData.addressLine1);
        expect(result.addressLine2).toBe(testData.addressLine2);
        expect(result.city).toBe(testData.city);
        expect(result.state).toBe(testData.state);
        expect(result.country).toBe(testData.country);
        expect(result.zipCode).toBe(testData.zipCode);
    });

    test('Should throw ValidationException because we want to create an empty address', async () => {
        expect.assertions(1);
        await addressService.create({} as AddressCreateRequest).catch(e =>
            expect(e).toEqual(new ValidationException('Request body is not valid', []))
        );
    });

    test('Should list addresses with our new create one', async () => {
        const addressesCollection = await addressService.findAll();
        const addresses = addressesCollection.toJSON();
        expect(addresses.length).toBe(1);

        const result = addresses[0];
        expect(result.title).toBe(testData.title);
        expect(result.addressLine1).toBe(testData.addressLine1);
        expect(result.addressLine2).toBe(testData.addressLine2);
        expect(result.city).toBe(testData.city);
        expect(result.state).toBe(testData.state);
        expect(result.country).toBe(testData.country);
        expect(result.zipCode).toBe(testData.zipCode);

    });

    test('Should return one address', async () => {
        const addressModel: Address = await addressService.findOne(createdId);
        const result = addressModel.toJSON();

        expect(result.title).toBe(testData.title);
        expect(result.addressLine1).toBe(testData.addressLine1);
        expect(result.addressLine2).toBe(testData.addressLine2);
        expect(result.city).toBe(testData.city);
        expect(result.state).toBe(testData.state);
        expect(result.country).toBe(testData.country);
        expect(result.zipCode).toBe(testData.zipCode);

    });

    test('Should update the address', async () => {
        const addressModel: Address = await addressService.update(createdId, testDataUpdated);
        const result = addressModel.toJSON();

        expect(result.title).toBe(testDataUpdated.title);
        expect(result.addressLine1).toBe(testDataUpdated.addressLine1);
        expect(result.addressLine2).toBe(testDataUpdated.addressLine2);
        expect(result.city).toBe(testDataUpdated.city);
        expect(result.state).toBe(testDataUpdated.state);
        expect(result.country).toBe(testDataUpdated.country);
        expect(result.zipCode).toBe(testDataUpdated.zipCode);
    });

    test('Should delete the address', async () => {
        expect.assertions(1);
        await addressService.destroy(createdId);
        await addressService.findOne(createdId).catch(e =>
            expect(e).toEqual(new NotFoundException(createdId))
        );
    });

});
