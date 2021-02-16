// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * from 'jest';
import * as resources from 'resources';
import * as Faker from 'faker';
import { BlackBoxTestUtil } from '../lib/BlackBoxTestUtil';
import { Commands } from '../../../src/api/commands/CommandEnumType';
import { Logger as LoggerType } from '../../../src/core/Logger';

describe('MarketDefaultCommand', () => {

    jasmine.DEFAULT_TIMEOUT_INTERVAL = process.env.JASMINE_TIMEOUT;

    const log: LoggerType = new LoggerType(__filename);

    const randomBoolean: boolean = Math.random() >= 0.5;
    const testUtil = new BlackBoxTestUtil(randomBoolean ? 0 : 1);

    const marketCommand = Commands.MARKET_ROOT.commandName;
    const marketDefaultCommand = Commands.MARKET_DEFAULT.commandName;

    let profile: resources.Profile;
    let market: resources.Market;

    beforeAll(async () => {
        await testUtil.cleanDb();

        profile = await testUtil.getDefaultProfile();
        expect(profile.id).toBeDefined();
        market = await testUtil.getDefaultMarket(profile.id);
        expect(market.id).toBeDefined();

    });

    test('Should return the default Market for Profile', async () => {
        const res = await testUtil.rpc(marketCommand, [marketDefaultCommand,
            profile.id
        ]);
        res.expectJson();
        res.expectStatusCode(200);

        const result: resources.Market = res.getBody()['result'];
        expect(result.id).toBe(market.id);
    });

    test('Should set the default Market for Profile', async () => {
        const res = await testUtil.rpc(marketCommand, [marketDefaultCommand,
            profile.id,
            market.id
        ]);
        res.expectJson();
        res.expectStatusCode(200);

        const result: resources.Market = res.getBody()['result'];
        expect(result.id).toBe(market.id);
    });

});
