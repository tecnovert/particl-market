// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import * as resources from 'resources';
import * as Faker from 'faker';
import { app } from '../../../src/app';
import { api, rpc, ApiOptions } from './api';
import { Commands } from '../../../src/api/commands/CommandEnumType';
import { CreatableModel } from '../../../src/api/enums/CreatableModel';
import { LoggerConfig } from '../../../src/config/LoggerConfig';
import { Logger as LoggerType } from '../../../src/core/Logger';
import { AddressType } from '../../../src/api/enums/AddressType';
import { MessageException } from '../../../src/api/exceptions/MessageException';
import { ShippingCountries } from '../../../src/core/helpers/ShippingCountries';
import { MarketType } from '../../../src/api/enums/MarketType';
import { MarketRegion } from '../../../src/api/enums/MarketRegion';
import { PrivateKey, Networks } from 'particl-bitcore-lib';
import * as jpeg from 'jpeg-js';


export class BlackBoxTestUtil {

    public log: LoggerType = new LoggerType(__filename);
    private node;

    constructor(node: number = 0) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = process.env.JASMINE_TIMEOUT;
        new LoggerConfig().configure();
        this.node = node;
    }

    /**
     * clean the db, also seeds the default data
     *
     * @returns {Promise<void>}
     */
    public async cleanDb(seed: boolean = true): Promise<boolean> {

        this.log.debug('cleanDb, this.node', this.node);
        const res = await this.rpc(Commands.DATA_ROOT.commandName, [Commands.DATA_CLEAN.commandName, seed]);
        res.expectJson();
        res.expectStatusCode(200);

        return res.getBody()['result'];

    }

    /**
     * add your custom data
     *
     * @param model
     * @param data
     * @returns {Promise<any>}
     */
    public async addData(model: CreatableModel, data: any): Promise<any> {
        const res = await this.rpc(Commands.DATA_ROOT.commandName, [Commands.DATA_ADD.commandName, model.toString(), JSON.stringify(data)]);
        res.expectJson();
        expect(res.error).toBe(null);
        res.expectStatusCode(200);
        return res.getBody()['result'];
    }

    /**
     * generate real looking test data
     *
     * @param model - CreatableModel
     * @param amount - amount of models to create
     * @param withRelated - return full related model data or just id's, defaults to true
     * @param generateParams
     * @returns {Promise<any>}
     */
    public async generateData(model: CreatableModel, amount: number = 1, withRelated: boolean = true, generateParams: any[] = []): Promise<any> {
        const params = [Commands.DATA_GENERATE.commandName, model.toString(), amount, withRelated]
            .concat(generateParams);
            // console.log(params);
        const res: any = await this.rpc(Commands.DATA_ROOT.commandName, params);
        res.expectJson();
        res.expectStatusCode(200);
        return res.getBody()['result'];
    }

    /**
     *
     * @param {boolean} generateShippingAddress, default true
     * @returns {Promise<"resources".Profile>}
     */
    public async getDefaultProfile(generateShippingAddress: boolean = true): Promise<resources.Profile> {
        const res: any = await this.rpc(Commands.PROFILE_ROOT.commandName, [Commands.PROFILE_DEFAULT.commandName]);

        res.expectJson();
        res.expectStatusCode(200);

        const defaultProfile: resources.Profile = res.getBody()['result'];

        // this.log.debug('defaultProfile', JSON.stringify(defaultProfile, null, 2));

        if (_.isEmpty(defaultProfile.ShippingAddresses
            || _.find(defaultProfile.ShippingAddresses, (address: resources.Address) => {
                    return AddressType.SHIPPING_OWN === address.type;
        }) === undefined )) {

            if (generateShippingAddress) {
                // this.log.debug('Adding a missing ShippingAddress for the default Profile.');

                // if default profile doesnt have a shipping address, add it
                // TODO: generate a random address
                const addCommandParams = [
                    Commands.ADDRESS_ADD.commandName,
                    defaultProfile.id,
                    Faker.name.firstName(),
                    Faker.name.lastName(),
                    Faker.company.companyName(),
                    Faker.address.streetAddress(),
                    Faker.address.secondaryAddress(),
                    Faker.address.city(),
                    Faker.address.state(),
                    Faker.random.arrayElement(Object.getOwnPropertyNames(ShippingCountries.countryCodeList)),
                    Faker.address.zipCode(),
                    AddressType.SHIPPING_OWN
                ];

                // create address for default profile
                const addressRes: any = await this.rpc(Commands.ADDRESS_ROOT.commandName, addCommandParams);
                addressRes.expectJson();
                addressRes.expectStatusCode(200);

            }

            // get the updated profile
            const profileRes: any = await this.rpc(Commands.PROFILE_ROOT.commandName, [Commands.PROFILE_GET.commandName, 'DEFAULT']);
            return profileRes.getBody()['result'];
        } else {
            return defaultProfile;
        }
    }

    public async getRandomBase64Image(): Promise<string> {
/*
        return await require('request')({
            url: 'https://picsum.photos/200/300/?random'
        }, function (e,r,b) {
            const type    = r.headers['content-type'];
            const prefix  = 'data:' + type + ';base64,';
            const base64  = Buffer.from(b, 'binary').toString('base64');
            const dataURI = prefix + base64;
            return dataURI;
        });
*/
        const request = require('request').defaults({ encoding: 'base64' });

        const result = await request.get('https://picsum.photos/200/300/?random', (error, response, body) => {
            if (!error && response.statusCode === 200) {
                return 'data:' + response.headers['content-type'] + ';base64,' + Buffer.from(body).toString('base64');
            }
        });
        return result;
    }

    /**
     * Generates an random colored image with specified width, height and quality
     * @param width width of the image
     * @param height height of the image
     * @param quality quality of the image
     */
    public async generateRandomImage(width: number = 800, height: number = 600, quality: number = 50): Promise<string> {
        const frameData = Buffer.alloc(width * height * 4);
        let i = 0;
        while (i < frameData.length) {
            frameData[i++] = Math.floor(Math.random() * 256);
        }
        const rawImageData = {
            data: frameData,
            width,
            height
        };
        const generatedImage: jpeg.RawImageData<Buffer> = jpeg.encode(rawImageData, quality);
        return generatedImage.data.toString('base64');
    }

    public async getDefaultMarket(profileId: number): Promise<resources.Market> {
        const res: any = await this.rpc(Commands.MARKET_ROOT.commandName, [Commands.MARKET_DEFAULT.commandName, profileId]);
        res.expectJson();
        res.expectStatusCode(200);
        return res.getBody()['result'];
    }

    public async getRandomCategory(): Promise<resources.ItemCategory> {
        const res: any = await this.rpc(Commands.CATEGORY_ROOT.commandName, [Commands.CATEGORY_LIST.commandName]);
        res.expectJson();
        res.expectStatusCode(200);

        const result: any = res.getBody()['result'];
        expect(result.key).toBeDefined();
        expect(result.name).toBe('ROOT');
        expect(result.market).toBeNull();
        expect(result.ParentItemCategory).not.toBeDefined();
        const childItemCategories = result.ChildItemCategories;
        expect(childItemCategories.length).toBeGreaterThan(0);
        const childCat: resources.ItemCategory = Faker.random.arrayElement(result.ChildItemCategories);
        return Faker.random.arrayElement(childCat.ChildItemCategories);
    }

    public async createMarketplace(type: MarketType, profileId: number, identityId: number): Promise<resources.Market> {

        const network = Networks.testnet;
        let privateKey: PrivateKey = PrivateKey.fromRandom(network);

        const marketData = {
            name: 'TEST-1',
            description: 'test market desc',
            type: MarketType.MARKETPLACE,
            region: MarketRegion.WORLDWIDE,
            receiveKey: privateKey.toWIF(),
            publishKey: privateKey.toWIF()
            // publishKey === receiveKey
        };

        switch (type) {
            case MarketType.MARKETPLACE:
                marketData.name = 'TEST-1';
                marketData.type = MarketType.MARKETPLACE;
                break;

            case MarketType.STOREFRONT_ADMIN:
                marketData.name = 'TEST-2';
                marketData.type = MarketType.STOREFRONT_ADMIN;
                privateKey = PrivateKey.fromRandom(network);
                marketData.publishKey = privateKey.toWIF();
                break;

            case MarketType.STOREFRONT:
                marketData.name = 'TEST-3';
                marketData.type = MarketType.STOREFRONT;
                privateKey = PrivateKey.fromRandom(network);
                marketData.receiveKey = privateKey.toWIF();
                privateKey = PrivateKey.fromRandom(network);
                marketData.publishKey = privateKey.toPublicKey().toString();
                break;

            default:
                break;
        }

        const res = await this.rpc(Commands.MARKET_ROOT.commandName, [Commands.MARKET_ADD.commandName,
            profileId,
            marketData.name,
            marketData.type,
            marketData.receiveKey,
            marketData.publishKey,
            identityId,
            marketData.description
        ]);
        res.expectJson();
        res.expectStatusCode(200);
        return res.getBody()['result'];
    }


    public async unlockLockedOutputs(wallet: string): Promise<resources.Market> {

        let response: any = await this.rpc(Commands.DAEMON_ROOT.commandName, [wallet, 'listlockunspent']);
        response.expectJson();
        response.expectStatusCode(200);
        const result = response.getBody()['result'];

        if (result.length > 0) {
            this.log.debug('==> Found locked outputs:', JSON.stringify(result, null, 2));
            response = await this.rpc(Commands.DAEMON_ROOT.commandName, [wallet, 'lockunspent', true, result]);
            response.expectJson();
            response.expectStatusCode(200);
            this.log.debug('==> No locked outputs left.');
        } else {
            this.log.debug('==> No locked outputs.');
        }
    }

    public async rpc(method: string, params: any[] = [], logError: boolean = true): Promise<any> {
        const response = await rpc(method, params, this.node);
        if (logError && response.error) {
            this.log.error('ERROR: ' + JSON.stringify(response.error.error.message));
        }
        return response;
    }

    /**
     * wait for given amount of time
     *
     * @param {number} maxSeconds
     * @returns {Promise<boolean>}
     */
    public async waitFor(maxSeconds: number): Promise<boolean> {
        for (let i = 0; i < maxSeconds; i++) {
            this.log.debug('... ');
            await this.waitTimeOut(1000);
        }
        return true;
    }

    /**
     *
     * @param {string} method
     * @param {any[]} params
     * @param {number} maxSeconds
     * @param {number} waitForStatusCode
     * @param {string} waitForObjectProperty
     * @param waitForObjectPropertyValue
     * @param waitForCondition '=', '<', '>', default: '='
     * @returns {Promise<any>}
     */
    public async rpcWaitFor(method: string, params: any[] = [], maxSeconds: number = 10, waitForStatusCode: number = 200,
                            waitForObjectProperty?: string, waitForObjectPropertyValue?: any, waitForCondition?: string): Promise<any> {

        // this.log.debug('waitForCondition: ' + waitForCondition);
        waitForCondition = waitForCondition !== undefined ? waitForCondition : '='; // use '=' as default if not set

        this.log.debug('==[ rpcWaitFor ]=============================================================================');
        this.log.debug('command: ' + method + ' ' + params.toString());
        this.log.debug('waiting for StatusCode: ' + waitForStatusCode);
        this.log.debug('waiting for ObjectProperty: ' + waitForObjectProperty);
        this.log.debug('waiting for ObjectPropertyValue: ' + JSON.stringify(waitForObjectPropertyValue));
        this.log.debug('waiting for condition: ObjectProperty ' + waitForCondition + ' ObjectPropertyValue');
        this.log.debug('=============================================================================================');

        let errorCount = 0;

        for (let i = 0; i < maxSeconds; i++) {

            // call every 5 seconds
            if (i % 5 === 0) {
                const response: any = await this.rpc(method, params, false);

                if (response.error) {
                    errorCount++;
                    if (errorCount < 5 || errorCount % 15 === 0) {
                        this.log.error(response.error.error.message);
                    }
                    if (errorCount === 5) {
                        this.log.error('... posting every 15th from now on...');
                    }

                } else if (waitForStatusCode === response.res.statusCode) {
                    if (waitForObjectProperty) {
                        const result = response.getBody()['result'];

                        // this.log.debug('result: ' + JSON.stringify(result, null, 2));

                        let objectPropertyValue;
                        if (waitForObjectProperty === '.length') {
                            objectPropertyValue = !_.isEmpty(result) ? result.length : 0;
                        } else {
                            objectPropertyValue = !_.isEmpty(result) ? _.get(result, waitForObjectProperty) : null;
                        }

                        // this.log.debug('typeof waitForObjectPropertyValue: ' + typeof waitForObjectPropertyValue);
                        // this.log.debug('waitForObjectPropertyValue.toString(): ' + waitForObjectPropertyValue.toString());
                        // this.log.debug('objectPropertyValue: ' + objectPropertyValue);
                        // this.log.debug('waitForCondition: ' + waitForCondition);
                        // this.log.debug('waitForObjectPropertyValue: ' + waitForObjectPropertyValue);

                        let waitForResult = false;

                        if (objectPropertyValue !== null) {
                            switch (waitForCondition) {
                                case '=':
                                    waitForResult = (objectPropertyValue === waitForObjectPropertyValue);
                                    break;
                                case '<':
                                    waitForResult = (objectPropertyValue < waitForObjectPropertyValue);
                                    break;
                                case '>':
                                    waitForResult = (objectPropertyValue > waitForObjectPropertyValue);
                                    break;
                                case '<=':
                                    waitForResult = (objectPropertyValue <= waitForObjectPropertyValue);
                                    break;
                                case '>=':
                                    waitForResult = (objectPropertyValue >= waitForObjectPropertyValue);
                                    break;
                                default:
                                    waitForResult = (objectPropertyValue === waitForObjectPropertyValue);
                                    break;
                            }
                        }
                        /*
                        if (objectPropertyValue != null && waitForCondition === '=') {
                            waitForResult = (objectPropertyValue === waitForObjectPropertyValue);
                        } else if (objectPropertyValue != null  && waitForCondition === '<') {
                            waitForResult = (objectPropertyValue < waitForObjectPropertyValue);
                        } else if (objectPropertyValue != null  && waitForCondition === '>') {
                            waitForResult = (objectPropertyValue > waitForObjectPropertyValue);
                        } else if (objectPropertyValue != null  && waitForCondition === '<=') {
                            waitForResult = (objectPropertyValue <= waitForObjectPropertyValue);
                        } else if (objectPropertyValue != null  && waitForCondition === '>=') {
                            waitForResult = (objectPropertyValue >= waitForObjectPropertyValue);
                        } else if (objectPropertyValue === waitForObjectPropertyValue && waitForCondition === '=') {
                            waitForResult = true;
                        }
                        */

                        // this.log.debug('waitForResult: ' + waitForResult);

                        if (waitForResult) {
                            this.log.debug('SUCCESS! statusCode === ' + waitForStatusCode
                                + ' && ' + waitForObjectProperty + ' ' + waitForCondition + ' ' + waitForObjectPropertyValue);
                            return response;
                        } else {

                            errorCount++;

                            if (errorCount < 5 || errorCount % 15 === 0) {
                                if (_.isEmpty(result)) {
                                    this.log.error('empty result.');
                                } else {
                                    this.log.error(waitForObjectProperty + ': ' + objectPropertyValue + ' ' + ' !' + waitForCondition
                                        + ' ' + waitForObjectPropertyValue);
                                }
                            }
                            if (errorCount === 5) {
                                this.log.error('... posting every 15th from now on...');
                            }

                            // do not throw here for now.
                            // for example bid searchBy will not throw an exception like findOne so the statusCode === 200,
                            // but we need to keep on querying until correct value is returned.
                            // throw new MessageException('rpcWaitFor received non-matching waitForObjectPropertyValue: ' + waitForObjectPropertyValue);
                        }
                    } else {
                        this.log.debug('SUCCESS! statusCode === ' + waitForStatusCode);
                        return response;
                    }
                } else {
                    this.log.debug('wtf?! not expecting this: ', response);
                }
            }

            // try again
            await this.waitTimeOut(1000);
        }

        this.log.error('rpcWaitFor did not receive expected response within given time.');
        throw new MessageException('rpcWaitFor did not receive expected response within given time.');
    }

    private waitTimeOut(timeoutMs: number): Promise<void> {

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, timeoutMs);
        });
    }

}


