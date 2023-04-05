// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

// tslint:disable:max-line-length
import * from 'jest';
import * as _ from 'lodash';
import * as resources from 'resources';
import * as Faker from 'faker';
import { app } from '../../src/app';
import { Logger as LoggerType } from '../../src/core/Logger';
import { Targets, Types } from '../../src/constants';
import { TestUtil } from './lib/TestUtil';
import { ValidationException } from '../../src/api/exceptions/ValidationException';
import { NotFoundException } from '../../src/api/exceptions/NotFoundException';
import { ListingItemCreateRequest } from '../../src/api/requests/model/ListingItemCreateRequest';
import { ItemInformationCreateRequest } from '../../src/api/requests/model/ItemInformationCreateRequest';
import { PaymentInformationCreateRequest } from '../../src/api/requests/model/PaymentInformationCreateRequest';
import { MessagingInformationCreateRequest } from '../../src/api/requests/model/MessagingInformationCreateRequest';
import { ListingItemObjectCreateRequest } from '../../src/api/requests/model/ListingItemObjectCreateRequest';
import { TestDataService } from '../../src/api/services/TestDataService';
import { ListingItemService } from '../../src/api/services/model/ListingItemService';
import { ListingItemTemplateService } from '../../src/api/services/model/ListingItemTemplateService';
import { ProfileService } from '../../src/api/services/model/ProfileService';
import { MarketService } from '../../src/api/services/model/MarketService';
import { ItemInformationService } from '../../src/api/services/model/ItemInformationService';
import { ItemLocationService } from '../../src/api/services/model/ItemLocationService';
import { LocationMarkerService } from '../../src/api/services/model/LocationMarkerService';
import { ShippingDestinationService } from '../../src/api/services/model/ShippingDestinationService';
import { ImageService } from '../../src/api/services/model/ImageService';
import { PaymentInformationService } from '../../src/api/services/model/PaymentInformationService';
import { EscrowService } from '../../src/api/services/model/EscrowService';
import { EscrowRatioService } from '../../src/api/services/model/EscrowRatioService';
import { ItemPriceService } from '../../src/api/services/model/ItemPriceService';
import { ShippingPriceService } from '../../src/api/services/model/ShippingPriceService';
import { CryptocurrencyAddressService } from '../../src/api/services/model/CryptocurrencyAddressService';
import { MessagingInformationService } from '../../src/api/services/model/MessagingInformationService';
import { ListingItemObjectService } from '../../src/api/services/model/ListingItemObjectService';
import { ListingItemObjectDataService } from '../../src/api/services/model/ListingItemObjectDataService';
import { ConfigurableHasher } from '@zasmilingidiot/omp-lib/dist/hasher/hash';
import { ImageVersions } from '../../src/core/helpers/ImageVersionEnumType';
import { ImageDataService } from '../../src/api/services/model/ImageDataService';
import { ItemCategoryCreateRequest } from '../../src/api/requests/model/ItemCategoryCreateRequest';
import { ShippingCountries } from '../../src/core/helpers/ShippingCountries';
import { LocationMarkerCreateRequest } from '../../src/api/requests/model/LocationMarkerCreateRequest';
import { ItemLocationCreateRequest } from '../../src/api/requests/model/ItemLocationCreateRequest';
import { ShippingAvailability } from '../../src/api/enums/ShippingAvailability';
import { ShippingDestinationCreateRequest } from '../../src/api/requests/model/ShippingDestinationCreateRequest';
import { ImageCreateRequest } from '../../src/api/requests/model/ImageCreateRequest';
import { EscrowReleaseType, EscrowType, MessagingProtocol, SaleType } from '@zasmilingidiot/omp-lib/dist/interfaces/omp-enums';
import { EscrowRatioCreateRequest } from '../../src/api/requests/model/EscrowRatioCreateRequest';
import { EscrowCreateRequest } from '../../src/api/requests/model/EscrowCreateRequest';
import { CryptoAddressType, Cryptocurrency } from '@zasmilingidiot/omp-lib/dist/interfaces/crypto';
import { toSatoshis } from '@zasmilingidiot/omp-lib/dist/util';
import { ShippingPriceCreateRequest } from '../../src/api/requests/model/ShippingPriceCreateRequest';
import { CryptocurrencyAddressCreateRequest } from '../../src/api/requests/model/CryptocurrencyAddressCreateRequest';
import { ItemPriceCreateRequest } from '../../src/api/requests/model/ItemPriceCreateRequest';
import { ImageDataCreateRequest } from '../../src/api/requests/model/ImageDataCreateRequest';
import { ProtocolDSN } from '@zasmilingidiot/omp-lib/dist/interfaces/dsn';
import { HashableListingItemTemplateCreateRequestConfig } from '../../src/api/factories/hashableconfig/createrequest/HashableListingItemTemplateCreateRequestConfig';
import { ListingItemObjectType } from '../../src/api/enums/ListingItemObjectType';
import { ListingItemObjectDataCreateRequest } from '../../src/api/requests/model/ListingItemObjectDataCreateRequest';
import { CoreRpcService } from '../../src/api/services/CoreRpcService';
import { SellerMessage } from '../../src/api/factories/message/ListingItemAddMessageFactory';
import {ListingItemSearchParams} from '../../src/api/requests/search/ListingItemSearchParams';
// tslint:enable:max-line-length

describe('ListingItem', () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = process.env.JASMINE_TIMEOUT;

    const log: LoggerType = new LoggerType(__filename);
    const testUtil = new TestUtil();

    let testDataService: TestDataService;
    let coreRpcService: CoreRpcService;
    let listingItemService: ListingItemService;
    let listingItemTemplateService: ListingItemTemplateService;
    let profileService: ProfileService;
    let marketService: MarketService;
    let itemInformationService: ItemInformationService;
    let itemLocationService: ItemLocationService;
    let locationMarkerService: LocationMarkerService;
    let shippingDestinationService: ShippingDestinationService;
    let imageService: ImageService;
    let imageDataService: ImageDataService;
    let paymentInformationService: PaymentInformationService;
    let escrowService: EscrowService;
    let escrowRatioService: EscrowRatioService;
    let itemPriceService: ItemPriceService;
    let shippingPriceService: ShippingPriceService;
    let cryptocurrencyAddressService: CryptocurrencyAddressService;
    let messagingInformationService: MessagingInformationService;
    let listingItemObjectService: ListingItemObjectService;
    let listingItemObjectDataService: ListingItemObjectDataService;

    let createdListingItem1: resources.ListingItem;
    let createdListingItem2: resources.ListingItem;
    let randomImageData: string;

    let profile: resources.Profile;
    let market: resources.Market;

    beforeAll(async () => {
        await testUtil.bootstrapAppContainer(app);  // bootstrap the app

        testDataService = app.IoC.getNamed<TestDataService>(Types.Service, Targets.Service.TestDataService);
        coreRpcService = app.IoC.getNamed<CoreRpcService>(Types.Service, Targets.Service.CoreRpcService);
        listingItemService = app.IoC.getNamed<ListingItemService>(Types.Service, Targets.Service.model.ListingItemService);
        listingItemTemplateService = app.IoC.getNamed<ListingItemTemplateService>(Types.Service, Targets.Service.model.ListingItemTemplateService);
        profileService = app.IoC.getNamed<ProfileService>(Types.Service, Targets.Service.model.ProfileService);
        marketService = app.IoC.getNamed<MarketService>(Types.Service, Targets.Service.model.MarketService);
        itemInformationService = app.IoC.getNamed<ItemInformationService>(Types.Service, Targets.Service.model.ItemInformationService);
        itemLocationService = app.IoC.getNamed<ItemLocationService>(Types.Service, Targets.Service.model.ItemLocationService);
        locationMarkerService = app.IoC.getNamed<LocationMarkerService>(Types.Service, Targets.Service.model.LocationMarkerService);
        shippingDestinationService = app.IoC.getNamed<ShippingDestinationService>(Types.Service, Targets.Service.model.ShippingDestinationService);
        imageService = app.IoC.getNamed<ImageService>(Types.Service, Targets.Service.model.ImageService);
        imageDataService = app.IoC.getNamed<ImageDataService>(Types.Service, Targets.Service.model.ImageDataService);
        paymentInformationService = app.IoC.getNamed<PaymentInformationService>(Types.Service, Targets.Service.model.PaymentInformationService);
        escrowService = app.IoC.getNamed<EscrowService>(Types.Service, Targets.Service.model.EscrowService);
        escrowRatioService = app.IoC.getNamed<EscrowRatioService>(Types.Service, Targets.Service.model.EscrowRatioService);
        itemPriceService = app.IoC.getNamed<ItemPriceService>(Types.Service, Targets.Service.model.ItemPriceService);
        shippingPriceService = app.IoC.getNamed<ShippingPriceService>(Types.Service, Targets.Service.model.ShippingPriceService);
        cryptocurrencyAddressService = app.IoC.getNamed<CryptocurrencyAddressService>(Types.Service, Targets.Service.model.CryptocurrencyAddressService);
        messagingInformationService = app.IoC.getNamed<MessagingInformationService>(Types.Service, Targets.Service.model.MessagingInformationService);
        listingItemObjectService = app.IoC.getNamed<ListingItemObjectService>(Types.Service, Targets.Service.model.ListingItemObjectService);
        listingItemObjectDataService = app.IoC.getNamed<ListingItemObjectDataService>(Types.Service, Targets.Service.model.ListingItemObjectDataService);

        // get default profile + market
        profile = await profileService.getDefault().then(value => value.toJSON());
        market = await testDataService.getMarketForProfile(profile.id).then(value => value.toJSON());

        randomImageData = await testDataService.generateRandomImage(10, 10);
    });


    // TODO: missing searchBy tests
    // TODO: test with images only on the template tests

    // -------------------------------
    // TESTS
    // -------------------------------
    test('Should throw ValidationException because we want to create a empty listing item', async () => {
        expect.assertions(1);
        await listingItemService.create({} as ListingItemCreateRequest).catch(e =>
            expect(e).toEqual(new ValidationException('Request body is not valid', []))
        );
    });

    test('Should create a new ListingItem', async () => {

        const testDataToSave: ListingItemCreateRequest = await generateListingItemCreateRequest(false);
        // log.debug('testDataToSave: ', JSON.stringify(testDataToSave, null, 2));
        createdListingItem1 = await listingItemService.create(testDataToSave).then(value => value.toJSON());
        // log.debug('createdListingItem1: ', JSON.stringify(createdListingItem1, null, 2));

        expectListingItemFromCreateRequest(createdListingItem1, testDataToSave);
    }, 600000); // timeout to 600s


    test('Should findOne ListingItem by id', async () => {
        const result: resources.ListingItem = await listingItemService.findOne(createdListingItem1.id).then(value => value.toJSON());
        expect(result.hash).toBe(createdListingItem1.hash);
    });

    test('Should findOne ListingItem by msgid', async () => {
        const result: resources.ListingItem = await listingItemService.findOneByMsgId(createdListingItem1.msgid).then(value => value.toJSON());
        expect(result.hash).toBe(createdListingItem1.hash);
    });

    test('Should findOne ListingItem by hash and market', async () => {
        const result: resources.ListingItem = await listingItemService.findOneByHashAndMarketReceiveAddress(createdListingItem1.hash,
            createdListingItem1.market).then(value => value.toJSON());
        expect(result.hash).toBe(createdListingItem1.hash);
    });

    test('Should create a new ListingItem WITHOUT ItemInformation, PaymentInformation, MessagingInformation and ListingItemObjects', async () => {
        const testDataToSave: ListingItemCreateRequest = await generateListingItemCreateRequest(false);

        // remove the stuff that we dont need in this test
        delete testDataToSave.itemInformation;
        delete testDataToSave.paymentInformation;
        delete testDataToSave.messagingInformation;
        delete testDataToSave.listingItemObjects;

        createdListingItem2 = await listingItemService.create(testDataToSave).then(value => value.toJSON());

        expectListingItemFromCreateRequest(createdListingItem2, testDataToSave);
    }, 600000); // timeout to 600s

    test('Should findAll ListingItems (2)', async () => {
        const result: resources.ListingItem[] = await listingItemService.findAll().then(value => value.toJSON());
        expect(result).toHaveLength(2);
    });

    test('Should delete ListingItem1', async () => {
        expect.assertions(15);
        await listingItemService.destroy(createdListingItem1.id);
        await expectListingItemWasDeleted(createdListingItem1);

        createdListingItem1 = undefined;
    });

    test('Should delete ListingItem2', async () => {
        expect.assertions(1);
        await listingItemService.destroy(createdListingItem2.id);
        await expectListingItemWasDeleted(createdListingItem2);

        createdListingItem2 = undefined;
    });

    test('Should create a new ListingItem without PaymentInformation, MessagingInformation and ListingItemObjects', async () => {
        const testDataToSave: ListingItemCreateRequest = await generateListingItemCreateRequest(false);

        // remove the stuff that we dont need in this test
        delete testDataToSave.paymentInformation;
        delete testDataToSave.messagingInformation;
        delete testDataToSave.listingItemObjects;

        createdListingItem1 = await listingItemService.create(testDataToSave).then(value => value.toJSON());

        expectListingItemFromCreateRequest(createdListingItem1, testDataToSave);
    }, 600000); // timeout to 600s

    test('Should delete the ListingItem with ItemInformation', async () => {
        expect.assertions(7);
        await listingItemService.destroy(createdListingItem1.id);
        await expectListingItemWasDeleted(createdListingItem1);

        createdListingItem1 = undefined;
    });

    test('Should create a new ListingItem without MessagingInformation and ListingItemObjects', async () => {
        const testDataToSave: ListingItemCreateRequest = await generateListingItemCreateRequest(false);

        // remove the stuff that we dont need in this test
        delete testDataToSave.messagingInformation;
        delete testDataToSave.listingItemObjects;

        createdListingItem1 = await listingItemService.create(testDataToSave).then(value => value.toJSON());

        expectListingItemFromCreateRequest(createdListingItem1, testDataToSave);
    }, 600000); // timeout to 600s

    test('Should delete the ListingItem with ItemInformation and PaymentInformation', async () => {
        expect.assertions(12);
        await listingItemService.destroy(createdListingItem1.id);
        await expectListingItemWasDeleted(createdListingItem1);
        createdListingItem1 = undefined;
    });

    test('Should create a new expired ListingItem', async () => {
        const testDataToSave: ListingItemCreateRequest = await generateListingItemCreateRequest(true);

        testDataToSave.expiredAt = Date.now() - 60 * 60 * 1000;

        // remove the stuff that we dont need in this test
        delete testDataToSave.itemInformation;
        delete testDataToSave.paymentInformation;
        delete testDataToSave.messagingInformation;
        delete testDataToSave.listingItemObjects;

        createdListingItem1 = await listingItemService.create(testDataToSave).then(value => value.toJSON());

        expectListingItemFromCreateRequest(createdListingItem1, testDataToSave);
    }, 600000); // timeout to 600s

    test('Should find expired ListingItema', async () => {
        await listingItemService.findAllExpired();
        await listingItemService.findOne(createdListingItem1.id).catch(e =>
            expect(e).toEqual(new NotFoundException(createdListingItem1.id))
        );
    });

    test('Should delete the expired ListingItem', async () => {
        expect.assertions(1);
        await listingItemService.destroy(createdListingItem1.id);
        await expectListingItemWasDeleted(createdListingItem1);
        createdListingItem1 = undefined;
    });

    test('Should create two new ListingItems, one without shippingDestination', async () => {
        let testDataToSave: ListingItemCreateRequest = await generateListingItemCreateRequest(false);
        createdListingItem1 = await listingItemService.create(testDataToSave).then(value => value.toJSON());
        expectListingItemFromCreateRequest(createdListingItem1, testDataToSave);

        testDataToSave = await generateListingItemCreateRequest(false);
        delete testDataToSave.itemInformation.shippingDestinations;
        createdListingItem2 = await listingItemService.create(testDataToSave).then(value => value.toJSON());
        expectListingItemFromCreateRequest(createdListingItem2, testDataToSave);

    }, 600000); // timeout to 600s

    test('Should find both when searching by shippingDestination', async () => {
        const searchParams = {
            shippingDestination: createdListingItem1.ItemInformation.ShippingDestinations[0].country
        } as ListingItemSearchParams;
        const result: resources.ListingItem[] = await listingItemService.search(searchParams).then(value => value.toJSON());
        expect(result).toHaveLength(2);
    }, 600000); // timeout to 600s

    test('Should delete the one with shippingDestination set', async () => {
        expect.assertions(13);
        await listingItemService.destroy(createdListingItem1.id);
        await expectListingItemWasDeleted(createdListingItem1, false);
    });

    test('Should find one when searching by shippingDestination', async () => {
        const searchParams = {
            shippingDestination: createdListingItem1.ItemInformation.ShippingDestinations[0].country
        } as ListingItemSearchParams;
        const result: resources.ListingItem[] = await listingItemService.search(searchParams).then(value => value.toJSON());
        expect(result).toHaveLength(1);
    }, 600000); // timeout to 600s

    test('Should delete the one with shippingDestination set', async () => {
        expect.assertions(14);
        await listingItemService.destroy(createdListingItem2.id);
        await expectListingItemWasDeleted(createdListingItem2, true);

        createdListingItem1 = undefined;
        createdListingItem2 = undefined;
    });

    const expectListingItemFromCreateRequest = (result: resources.ListingItem, createRequest: ListingItemCreateRequest) => {

        expect(result.hash).toBe(createRequest.hash);
        expect(result.seller).toBe(createRequest.seller);

        if (!_.isEmpty(createRequest.itemInformation)) {
            expectItemInformationFromCreateRequest(result.ItemInformation, createRequest.itemInformation);
        } else {
            expect(result.ItemInformation).toEqual({});
        }
        log.debug('itemInformation passed');

        if (!_.isEmpty(createRequest.paymentInformation)) {
            expectPaymentInformationFromCreateRequest(result.PaymentInformation, createRequest.paymentInformation);
        } else {
            expect(result.PaymentInformation).toEqual({});
        }
        log.debug('paymentInformation passed');

        if (!_.isEmpty(createRequest.messagingInformation)) {
            expectMessagingInformationFromCreateRequest(result.MessagingInformation, createRequest.messagingInformation);
        } else {
            expect(result.MessagingInformation).toEqual([]);
        }
        log.debug('messagingInformation passed');

        if (!_.isEmpty(createRequest.listingItemObjects)) {
            expectListingItemObjectsFromCreateRequest(result.ListingItemObjects, createRequest.listingItemObjects);
        } else {
            expect(result.ListingItemObjects).toEqual([]);
        }
        log.debug('listingItemObjects passed');

    };

    const expectItemInformationFromCreateRequest = (result: resources.ItemInformation, createRequest: ItemInformationCreateRequest) => {

        expect(result.title).toBe(createRequest.title);
        expect(result.shortDescription).toBe(createRequest.shortDescription);
        expect(result.longDescription).toBe(createRequest.longDescription);
        expect(result.ItemCategory.key).toBe(createRequest.itemCategory.key);
        // expect(result.ItemCategory.market).toBe(createRequest.itemCategory.market);
        expect(result.ItemLocation.country).toBe(createRequest.itemLocation.country);
        expect(result.ItemLocation.address).toBe(createRequest.itemLocation.address);
        expect(result.ItemLocation.LocationMarker.title).toBe(createRequest.itemLocation.locationMarker.title);
        expect(result.ItemLocation.LocationMarker.description).toBe(createRequest.itemLocation.locationMarker.description);
        expect(result.ItemLocation.LocationMarker.lat).toBe(createRequest.itemLocation.locationMarker.lat);
        expect(result.ItemLocation.LocationMarker.lng).toBe(createRequest.itemLocation.locationMarker.lng);
        expect(result.ShippingDestinations).toHaveLength(_.isNil(createRequest.shippingDestinations) ? 0 : createRequest.shippingDestinations.length);
        expect(result.Images).toHaveLength(createRequest.images.length);
        expect(result.Images[0].ImageDatas).toHaveLength(4); // 4 sizes
    };

    const expectPaymentInformationFromCreateRequest = (result: resources.PaymentInformation, createRequest: PaymentInformationCreateRequest) => {
        expect(result.type).toBe(createRequest.type);
        expect(result.Escrow.type).toBe(createRequest.escrow.type);
        expect(result.Escrow.Ratio.buyer).toBe(createRequest.escrow.ratio.buyer);
        expect(result.Escrow.Ratio.seller).toBe(createRequest.escrow.ratio.seller);
        expect(result.Escrow.releaseType).toBe(createRequest.escrow.releaseType);
        expect(result.ItemPrice.currency).toBe(createRequest.itemPrice.currency);
        expect(result.ItemPrice.basePrice).toBe(createRequest.itemPrice.basePrice);
        expect(result.ItemPrice.ShippingPrice.domestic).toBe(createRequest.itemPrice.shippingPrice.domestic);
        expect(result.ItemPrice.ShippingPrice.international).toBe(createRequest.itemPrice.shippingPrice.international);
        expect(result.ItemPrice.CryptocurrencyAddress.type).toBe(createRequest.itemPrice.cryptocurrencyAddress.type);
        expect(result.ItemPrice.CryptocurrencyAddress.address).toBe(createRequest.itemPrice.cryptocurrencyAddress.address);
    };

    const expectMessagingInformationFromCreateRequest = (results: resources.MessagingInformation, createRequest: MessagingInformationCreateRequest[]) => {
        expect(results[0].protocol).toBe(createRequest[0].protocol);
        expect(results[0].publicKey).toBe(createRequest[0].publicKey);
    };

    const expectListingItemObjectsFromCreateRequest = (results: resources.ListingItemObjects, createRequest: ListingItemObjectCreateRequest[]) => {
        expect(results[0].type).toBe(createRequest[0].type);
        expect(results[0].description).toBe(createRequest[0].description);
        expect(results[0].order).toBe(createRequest[0].order);
        expect(results[0].objectId).toBeDefined();
        expect(results[0].forceInput).toBeDefined();

        const objectDataResults = results[0].ListingItemObjectDatas;
        expect(objectDataResults[0].key).toBe(createRequest[0].listingItemObjectDatas[0].key);
        expect(objectDataResults[0].value).toBe(createRequest[0].listingItemObjectDatas[0].value);
    };

    const expectListingItemWasDeleted = async (item: resources.ListingItem, imageDeleted: boolean = true) => {
        await listingItemService.findOne(item.id).catch(e =>
            expect(e).toEqual(new NotFoundException(item.id))
        );

        // ItemInformation
        if (!_.isEmpty(item.ItemInformation)) {
            await itemInformationService.findOne(item.ItemInformation.id, false).catch(e =>
                expect(e).toEqual(new NotFoundException(item.ItemInformation.id))
            );

            // ItemLocation
            if (!_.isEmpty(item.ItemInformation.ItemLocation)) {
                await itemLocationService.findOne(item.ItemInformation.ItemLocation.id, false).catch(e =>
                    expect(e).toEqual(new NotFoundException(item.ItemInformation.ItemLocation.id))
                );

                // LocationMarker
                if (!_.isEmpty(item.ItemInformation.ItemLocation.LocationMarker)) {
                    await locationMarkerService.findOne(item.ItemInformation.ItemLocation.LocationMarker.id, false).catch(e =>
                        expect(e).toEqual(new NotFoundException(item.ItemInformation.ItemLocation.LocationMarker.id))
                    );
                }
            }

            // ShippingDestination
            if (!_.isEmpty(item.ItemInformation.ShippingDestinations)) {
                await shippingDestinationService.findOne(item.ItemInformation.ShippingDestinations[0].id, false).catch(e =>
                    expect(e).toEqual(new NotFoundException(item.ItemInformation.ShippingDestinations[0].id))
                );
            }

            // Image
            if (!_.isEmpty(item.ItemInformation.Images) && imageDeleted) {
                await imageService.findOne(item.ItemInformation.Images[0].id, false).catch(e =>
                    expect(e).toEqual(new NotFoundException(item.ItemInformation.Images[0].id))
                );

                if (!_.isEmpty(item.ItemInformation.Images[0].ImageDatas)) {
                    const data = await imageDataService.loadImageFile(item.ItemInformation.Images[0].hash, ImageVersions.ORIGINAL.propName)
                        .catch(reason => {
                            //
                        });
                    expect(data).toBeUndefined();
                }
            }
        }

        // PaymentInformation
        if (!_.isEmpty(item.PaymentInformation)) {
            await paymentInformationService.findOne(item.PaymentInformation.id, false).catch(e =>
                expect(e).toEqual(new NotFoundException(item.PaymentInformation.id))
            );

            // Escrow
            if (!_.isEmpty(item.PaymentInformation.Escrow)) {
                await escrowService.findOne(item.PaymentInformation.Escrow.id, false).catch(e =>
                    expect(e).toEqual(new NotFoundException(item.PaymentInformation.Escrow.id))
                );

                // EscrowRatio
                if (!_.isEmpty(item.PaymentInformation.Escrow)) {
                    await escrowRatioService.findOne(item.PaymentInformation.Escrow.Ratio.id, false).catch(e =>
                        expect(e).toEqual(new NotFoundException(item.PaymentInformation.Escrow.Ratio.id))
                    );
                }
            }

            // ItemPrice
            if (!_.isEmpty(item.PaymentInformation.ItemPrice)) {
                await itemPriceService.findOne(item.PaymentInformation.ItemPrice.id, false).catch(e =>
                    expect(e).toEqual(new NotFoundException(item.PaymentInformation.ItemPrice.id))
                );

                // ShippingPrice
                if (!_.isEmpty(item.PaymentInformation.ItemPrice.ShippingPrice)) {
                    await shippingPriceService.findOne(item.PaymentInformation.ItemPrice.ShippingPrice.id, false).catch(e =>
                        expect(e).toEqual(new NotFoundException(item.PaymentInformation.ItemPrice.ShippingPrice.id))
                    );
                }

                // CryptocurrencyAddress
                if (!_.isEmpty(item.PaymentInformation.ItemPrice.CryptocurrencyAddress)) {
                    await cryptocurrencyAddressService.findOne(item.PaymentInformation.ItemPrice.CryptocurrencyAddress.id, false).catch(e =>
                        expect(e).toEqual(new NotFoundException(item.PaymentInformation.ItemPrice.CryptocurrencyAddress.id))
                    );
                }
            }
        }

        // MessagingInformation
        if (!_.isEmpty(item.MessagingInformation)) {
            for (const messagingInformation of item.MessagingInformation) {
                await messagingInformationService.findOne(messagingInformation.id, false).catch(e =>
                    expect(e).toEqual(new NotFoundException(messagingInformation.id))
                );
            }
        }

        // ListingItemObjects
        if (!_.isEmpty(item.ListingItemObjects)) {
            for (const listingItemObject of item.ListingItemObjects) {
                // ListingItemObjectDatas
                const listintItemObjectDatas = listingItemObject.ListingItemObjectDatas;
                if (!_.isEmpty(listintItemObjectDatas)) {
                    for (const listintItemObjectData of listintItemObjectDatas) {
                        await listingItemObjectDataService.findOne(listintItemObjectData.id, false).catch(e =>
                            expect(e).toEqual(new NotFoundException(listintItemObjectData.id))
                        );
                    }
                }
                await listingItemObjectService.findOne(listingItemObject.id, false).catch(e =>
                    expect(e).toEqual(new NotFoundException(listingItemObject.id))
                );
            }
        }
    };

    const generateListingItemCreateRequest = async (expired: boolean = false): Promise<ListingItemCreateRequest> => {
        const now = Date.now();
        const randomCategory: resources.ItemCategory = await testDataService.getRandomCategory();

        const createRequest = {
            hash: Faker.random.uuid(),
            removed: false,
            msgid: Faker.random.uuid(),
            seller: market.Identity.address,
            market: market.receiveAddress,
            // listing_item_template_id: 0,
            expiryTime: 4,
            postedAt: now,
            expiredAt: expired ? now : now + 100000,
            receivedAt: now,
            generatedAt: now,
            itemInformation: {
                title: Faker.random.words(4),
                shortDescription: Faker.random.words(10),
                longDescription: Faker.random.words(30),
                itemCategory: {
                    key: randomCategory.key
                    // name: 'Test Data',
                    // description: 'Test Data Category',
                    // market: market.receiveAddress
                } as ItemCategoryCreateRequest,
                itemLocation: {
                    country: Faker.random.arrayElement(Object.getOwnPropertyNames(ShippingCountries.countryCodeList)),
                    address: Faker.address.streetAddress(),
                    description: Faker.lorem.paragraph(),
                    locationMarker: {
                        lat: _.random(-50, 50),
                        lng: _.random(-50, 50),
                        title: Faker.lorem.word(),
                        description: Faker.lorem.sentence()
                    } as LocationMarkerCreateRequest
                } as ItemLocationCreateRequest,
                shippingDestinations: [{
                    country: Faker.random.arrayElement(Object.getOwnPropertyNames(ShippingCountries.countryCodeList)),
                    shippingAvailability: ShippingAvailability.SHIPS
                }] as ShippingDestinationCreateRequest[],
                images: [{
                    data: [{
                        // when we receive ListingItemAddMessage -> ProtocolDSN.SMSG
                        // when we receive ListingItemImageAddMessage -> ProtocolDSN.FILE
                        protocol: ProtocolDSN.FILE,
                        encoding: 'BASE64',
                        dataId: 'https://particl.io/images/' + Faker.random.uuid(),
                        imageVersion: ImageVersions.ORIGINAL.propName,
                        imageHash: 'TEST-IMAGEHASH1',
                        data: randomImageData
                    }] as ImageDataCreateRequest[],
                    featured: false,
                    hash: 'TEST-IMAGEHASH1'
                }/*, {
                    data: [{
                        // when we receive ListingItemAddMessage -> ProtocolDSN.SMSG
                        // when we receive ListingItemImageAddMessage -> ProtocolDSN.FILE
                        protocol: ProtocolDSN.FILE,
                        encoding: 'BASE64',
                        dataId: 'https://particl.io/images/' + Faker.random.uuid(),
                        imageVersion: ImageVersions.ORIGINAL.propName,
                        imageHash: 'TEST-IMAGEHASH2',
                        data: randomImageData
                    }] as ImageDataCreateRequest[],
                    featured: false,
                    hash: 'TEST-IMAGEHASH2'
                }*/] as ImageCreateRequest[]
            } as ItemInformationCreateRequest,
            paymentInformation: {
                type: SaleType.SALE,
                escrow: {
                    type: EscrowType.MAD_CT,
                    secondsToLock: 4,
                    ratio: {
                        buyer: 100,
                        seller: 100
                    } as EscrowRatioCreateRequest,
                    releaseType: EscrowReleaseType.ANON
                } as EscrowCreateRequest,
                itemPrice: {
                    currency: Cryptocurrency.PART, // Faker.random.arrayElement(Object.getOwnPropertyNames(Currency)),
                    basePrice: toSatoshis(+_.random(0.1, 1.00).toFixed(8)),
                    shippingPrice: {
                        domestic: toSatoshis(+_.random(0.01, 0.10).toFixed(8)),
                        international: toSatoshis(+_.random(0.10, 0.20).toFixed(8))
                    } as ShippingPriceCreateRequest,
                    cryptocurrencyAddress: {
                        type: CryptoAddressType.STEALTH,
                        address: Faker.finance.bitcoinAddress()
                    } as CryptocurrencyAddressCreateRequest
                } as ItemPriceCreateRequest
            } as PaymentInformationCreateRequest,
            messagingInformation: [{
                protocol: Faker.random.arrayElement(Object.getOwnPropertyNames(MessagingProtocol)),
                publicKey: Faker.random.uuid()
            }] as MessagingInformationCreateRequest[],
            listingItemObjects: [{
                type: Faker.random.arrayElement(Object.getOwnPropertyNames(ListingItemObjectType)),
                description: Faker.lorem.paragraph(),
                order: 0,
                listingItemObjectDatas: [{
                    key: Faker.lorem.slug(),
                    value: Faker.lorem.word()
                }] as ListingItemObjectDataCreateRequest[]
            }] as ListingItemObjectCreateRequest[]
        } as ListingItemCreateRequest;

        createRequest.hash = ConfigurableHasher.hash(createRequest, new HashableListingItemTemplateCreateRequestConfig());

        const message = {
            address: market.Identity.address,
            hash: createRequest.hash
        } as SellerMessage;

        const signature = await coreRpcService.signMessage(market.Identity.wallet, market.Identity.address, message);
        createRequest.signature = signature;

        return createRequest;
    };

});
