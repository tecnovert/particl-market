// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * from 'jest';
import * as resources from 'resources';
import { BlackBoxTestUtil } from '../lib/BlackBoxTestUtil';
import { Commands } from '../../../src/api/commands/CommandEnumType';
import { Logger as LoggerType } from '../../../src/core/Logger';
import { MissingParamException } from '../../../src/api/exceptions/MissingParamException';
import { InvalidParamException } from '../../../src/api/exceptions/InvalidParamException';
import { ModelNotFoundException } from '../../../src/api/exceptions/ModelNotFoundException';

describe('SettingSetCommand', () => {

    jasmine.DEFAULT_TIMEOUT_INTERVAL = process.env.JASMINE_TIMEOUT;

    const log: LoggerType = new LoggerType(__filename);

    const randomBoolean: boolean = Math.random() >= 0.5;
    const testUtil = new BlackBoxTestUtil(randomBoolean ? 0 : 1);

    const settingCommand = Commands.SETTING_ROOT.commandName;
    const settingSetCommand = Commands.SETTING_SET.commandName;

    let market: resources.Market;
    let profile: resources.Profile;

    const testData = {
        key: 'key',
        value: 'value'
    };

    const testDataUpdated = {
        key: 'keyUPDATED',
        value: 'valueUPDATED'
    };

    beforeAll(async () => {
        await testUtil.cleanDb();

        profile = await testUtil.getDefaultProfile();
        expect(profile.id).toBeDefined();
        market = await testUtil.getDefaultMarket(profile.id);
        expect(market.id).toBeDefined();

    });

    test('Should fail to set Setting because missing key', async () => {
        const res = await testUtil.rpc(settingCommand, [settingSetCommand]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new MissingParamException('key').getMessage());
    });

    test('Should fail to set Setting because missing value', async () => {
        const res = await testUtil.rpc(settingCommand, [settingSetCommand,
            testData.key
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new MissingParamException('value').getMessage());
    });

    test('Should fail to set Setting because missing profileId', async () => {
        const res = await testUtil.rpc(settingCommand, [settingSetCommand,
            testData.key,
            testData.value
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new MissingParamException('profileId').getMessage());
    });

    test('Should fail to set Setting because invalid key', async () => {
        const res = await testUtil.rpc(settingCommand, [settingSetCommand,
            false,
            testData.value,
            profile.id
        ]);
        res.expectJson();
        res.expectStatusCode(400);
        expect(res.error.error.message).toBe(new InvalidParamException('key', 'string').getMessage());
    });

    test('Should fail to set Setting because invalid value', async () => {
        const res = await testUtil.rpc(settingCommand, [settingSetCommand,
            testData.key,
            false,
            profile.id
        ]);
        res.expectJson();
        res.expectStatusCode(400);
        expect(res.error.error.message).toBe(new InvalidParamException('value', 'string').getMessage());
    });

    test('Should fail to set Setting because invalid profileId', async () => {
        const res = await testUtil.rpc(settingCommand, [settingSetCommand,
            testData.key,
            testData.value,
            false
        ]);
        res.expectJson();
        res.expectStatusCode(400);
        expect(res.error.error.message).toBe(new InvalidParamException('profileId', 'number').getMessage());
    });

    test('Should fail to set Setting because invalid marketId', async () => {
        const res = await testUtil.rpc(settingCommand, [settingSetCommand,
            testData.key,
            testData.value,
            1,
            false
        ]);
        res.expectJson();
        res.expectStatusCode(400);
        expect(res.error.error.message).toBe(new InvalidParamException('marketId', 'number').getMessage());
    });

    test('Should fail to set Setting because missing Profile model', async () => {
        const missingProfileId = 0;
        const res = await testUtil.rpc(settingCommand, [settingSetCommand,
            testData.key,
            testData.value,
            0
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new ModelNotFoundException('Profile').getMessage());
    });

    test('Should fail to set Setting because missing Market model', async () => {
        const res = await testUtil.rpc(settingCommand, [settingSetCommand,
            testData.key,
            testData.value,
            profile.id,
            0
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new ModelNotFoundException('Market').getMessage());
    });

    test('Should set a Setting for Profile', async () => {
        const res = await testUtil.rpc(settingCommand, [settingSetCommand,
            testData.key,
            testData.value,
            profile.id
        ]);
        res.expectJson();
        res.expectStatusCode(200);

        const result: resources.Setting = res.getBody()['result'];
        expect(result.Profile).toBeDefined();
        expect(result.Profile.id).toBe(profile.id);
        expect(result.Market).toBeUndefined();
        expect(result.key).toBe(testData.key);
        expect(result.value).toBe(testData.value);
    });

    test('Should update the previously created Setting', async () => {
        const res = await testUtil.rpc(settingCommand, [settingSetCommand,
            testDataUpdated.key,
            testDataUpdated.value,
            profile.id
        ]);
        res.expectJson();
        res.expectStatusCode(200);

        const result: resources.Setting = res.getBody()['result'];
        expect(result.Profile).toBeDefined();
        expect(result.Profile.id).toBe(profile.id);
        expect(result.key).toBe(testDataUpdated.key);
        expect(result.value).toBe(testDataUpdated.value);
    });

    test('Should set a Setting for Profile and Market', async () => {
        const res = await testUtil.rpc(settingCommand, [settingSetCommand,
            testData.key,
            testData.value,
            profile.id,
            market.id
        ]);
        res.expectJson();
        res.expectStatusCode(200);

        const result: resources.Setting = res.getBody()['result'];
        expect(result.Profile).toBeDefined();
        expect(result.Profile.id).toBe(profile.id);
        expect(result.Market).toBeDefined();
        expect(result.Market.id).toBe(market.id);
        expect(result.key).toBe(testData.key);
        expect(result.value).toBe(testData.value);
    });

});
