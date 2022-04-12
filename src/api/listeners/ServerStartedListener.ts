// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import * as resources from 'resources';
import * as interfaces from '../../types/interfaces';
import pForever from 'pm-forever';
import delay from 'pm-delay';
import { inject, named } from 'inversify';
import { Core, Targets, Types } from '../../constants';
import { Logger as LoggerType } from '../../core/Logger';
import { DefaultItemCategoryService } from '../services/DefaultItemCategoryService';
import { DefaultProfileService } from '../services/DefaultProfileService';
import { EventEmitter } from '../../core/api/events';
import { WaitingMessageService } from '../services/observer/WaitingMessageService';
import { CoreRpcService } from '../services/CoreRpcService';
import { CoreMessageProcessor } from '../messageprocessors/CoreMessageProcessor';
import { ProposalResultRecalcService } from '../services/observer/ProposalResultRecalcService';
import { DefaultSettingService } from '../services/DefaultSettingService';
import { SettingService } from '../services/model/SettingService';
import { CoreCookieService } from '../services/observer/CoreCookieService';
import { SmsgService } from '../services/SmsgService';
import { CoreConnectionStatusService } from '../services/observer/CoreConnectionStatusService';
import { IdentityService } from '../services/model/IdentityService';
import { ExpiredListingItemService } from '../services/observer/ExpiredListingItemService';
import { MarketService } from '../services/model/MarketService';
import { ProfileService } from '../services/model/ProfileService';
import { CoreConnectionStatusServiceStatus } from '../enums/CoreConnectionStatusServiceStatus';
import { ExpiredProposalService } from '../services/observer/ExpiredProposalService';
import { RpcBlockchainInfo } from '@zasmilingidiot/omp-lib/dist/interfaces/rpc';
import { SettingValue } from '../enums/SettingValue';
import { SettingUpdateRequest } from '../requests/model/SettingUpdateRequest';
import { SettingCreateRequest } from '../requests/model/SettingCreateRequest';

export class ServerStartedListener implements interfaces.Listener {

    public static Event = Symbol('ServerStartedListenerEvent');

    public log: LoggerType;

    public updated = 0;
    public isStarted = false;       // todo: status enum
    private previousState = false;

    private timeout: any;

    private INTERVAL = 1000;
    private STOP = false;
    private BOOTSTRAPPING = true;

    // tslint:disable:max-line-length
    constructor(
        @inject(Types.MessageProcessor) @named(Targets.MessageProcessor.CoreMessageProcessor) public coreMessageProcessor: CoreMessageProcessor,
        @inject(Types.Service) @named(Targets.Service.DefaultItemCategoryService) public defaultItemCategoryService: DefaultItemCategoryService,
        @inject(Types.Service) @named(Targets.Service.DefaultProfileService) public defaultProfileService: DefaultProfileService,
        @inject(Types.Service) @named(Targets.Service.DefaultSettingService) public defaultSettingService: DefaultSettingService,
        @inject(Types.Service) @named(Targets.Service.model.IdentityService) public identityService: IdentityService,
        @inject(Types.Service) @named(Targets.Service.model.SettingService) public settingService: SettingService,
        @inject(Types.Service) @named(Targets.Service.model.MarketService) public marketService: MarketService,
        @inject(Types.Service) @named(Targets.Service.model.ProfileService) public profileService: ProfileService,
        @inject(Types.Service) @named(Targets.Service.observer.CoreCookieService) public coreCookieService: CoreCookieService,

        // inject all observers here to make sure they start up
        @inject(Types.Service) @named(Targets.Service.observer.CoreConnectionStatusService) public coreConnectionStatusService: CoreConnectionStatusService,
        @inject(Types.Service) @named(Targets.Service.observer.WaitingMessageService) public waitingMessageService: WaitingMessageService,
        @inject(Types.Service) @named(Targets.Service.observer.ProposalResultRecalcService) public proposalResultRecalcService: ProposalResultRecalcService,
        @inject(Types.Service) @named(Targets.Service.observer.ExpiredListingItemService) public expiredListingItemService: ExpiredListingItemService,
        @inject(Types.Service) @named(Targets.Service.observer.ExpiredProposalService) public expiredProposalService: ExpiredProposalService,

        @inject(Types.Service) @named(Targets.Service.CoreRpcService) public coreRpcService: CoreRpcService,
        @inject(Types.Service) @named(Targets.Service.SmsgService) public smsgService: SmsgService,
        @inject(Types.Core) @named(Core.Events) public eventEmitter: EventEmitter,
        @inject(Types.Core) @named(Core.Logger) Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }
    // tslint:enable:max-line-length

    /**
     *
     * @param payload
     * @returns {Promise<void>}
     */
    public async act(payload: any): Promise<any> {
        this.log.info('Received event ServerStartedListenerEvent', payload);
        this.start();
    }

    public async start(): Promise<void> {
        this.log.debug('start(): ');

        await pForever(async (i) => {
            i++;

            // this.log.debug('this.coreCookieService.status: ' + this.coreCookieService.status);
            // this.log.debug('this.coreConnectionStatusService.status: ' + this.coreConnectionStatusService.connectionStatus);
            if (this.BOOTSTRAPPING) {
                this.log.debug('bootstrapping...');
            }

            // keep checking whether we are connected to the core and when we are, call this.bootstrap()
            // then STOP the polling, if bootstrap was successful
            if (this.coreConnectionStatusService.connectionStatus === CoreConnectionStatusServiceStatus.CONNECTED
                && this.BOOTSTRAPPING) {
                this.STOP = await this.bootstrap()
                    .then((started) => {
                        this.isStarted = started;
                        return started;
                    })
                    .catch(reason => {
                        this.log.error('ERROR: marketplace bootstrap failed: ', reason);
                        // stop if there's an error
                        return true;
                    });
                this.BOOTSTRAPPING = false;
            }

            this.updated = Date.now();
            if (this.STOP) {
                this.log.info('Server started!');
                return pForever.end;
            }
            await delay(this.INTERVAL);
            // this.log.debug('ServerStartedListener.start(), i: ', i);

            return i;
        }, 0).catch(async reason => {
            this.log.error('ERROR: ', reason);
            await delay(this.INTERVAL);
            this.start();
        });
    }

    /**
     *  - Default Profile, Market and Identity creation on app startup.
     *    - if updating from previous installation (a market wallet already exists),
     *      - create new Identity (+wallet) for the Profile (Identity for the Market should already exist)
     *      - rename the existing Market to "old market" or something
     *    - on new installation:
     *      - create Profile with new Identity (+wallet)
     *    - create Market with new Identity (+wallet)
     *    - set the new Market as the default one
     */
    public async bootstrap(): Promise<boolean> {
        // all is now ready for bootstrapping the app
        const blockchainInfo: RpcBlockchainInfo = await this.coreRpcService.getBlockchainInfo();
        process.env.CHAIN = blockchainInfo.chain;

        // are we updating from previous installation (a market wallet already exists+no profile identity)
        // Removed this logic for now as the DB is new (new MP version) and
        //  attempting to derive from an existing 'market' wallet that is encrypted at the time prevents the initialization from completing
        //  (even on subsequent attempts to start the service) and requires manual user intervention to delete various files, wallets, etc
        const isUpgradingFromSingleMarketWallet = false; // await this.isUpgradingFromSingleMarketWallet();
        // this.log.debug('bootstrap(), isUpgradingFromSingleMarketWallet: ', isUpgradingFromSingleMarketWallet);

        let defaultProfile: resources.Profile;
        if (isUpgradingFromSingleMarketWallet) {

            // create new Identity (+wallet) for the default Profile
            defaultProfile = await this.defaultProfileService.upgradeDefaultProfile();
            this.log.debug('bootstrap(), upgraded old default Profile: ', JSON.stringify(defaultProfile, null, 2));

        } else { // not upgrading...
            // create new Profile with new Identity (+wallet)
            defaultProfile = await this.defaultProfileService.seedDefaultProfile();
        }

        // save/update the default env vars as Settings
        await this.defaultSettingService.saveDefaultSettings(defaultProfile);
        await this.defaultSettingService.upgradeDefaultSettings();

        await this.loadWalletsForProfile(defaultProfile);

        // Seed the default ItemCategories (ItemCategory with no relation to a Market)
        // - ListingItemTemplates are assigned an ItemCategory from the list of default ItemCategories
        // - market ItemCategories are created for Markets as new ListingItems are received
        await this.defaultItemCategoryService.seedDefaultCategories();

        // Ensure the necessary default identity exists or is loaded correctly
        const identities: resources.Identity[] = await this.identityService.findAllByProfileId(defaultProfile.id).then(value => value.toJSON());
        const defaultIdentityName = 'particl-market';
        const hasDefaultIdentity = identities.findIndex(identity => identity.name === defaultIdentityName) >= 0;
        if ((identities.length === 0) || !hasDefaultIdentity) {
            await this.identityService.createMarketIdentityForProfile(defaultProfile, defaultIdentityName, true);
        }

        await this.enforceSingleRunTasks();

        this.log.info('bootstrap(), done.');

        return true;
    }

    /**
     * loads wallets for given Profile, returns the names of wallets loaded
     * @param profile
     */
    private async loadWalletsForProfile(profile: resources.Profile): Promise<string[]> {
        const identitiesToLoad: resources.Identity[] = await this.identityService.findAllByProfileId(profile.id).then(value => value.toJSON());

        // make sure the addresses are added as smsg receive addresses
        for (const identity of identitiesToLoad) {
            await this.smsgService.smsgAddLocalAddress(identity.address);
        }

        const walletsToLoad: string[] = identitiesToLoad.map( value => {
            return value.wallet;
        });
        this.log.debug('loadWalletsForProfile(), walletsToLoad: ', JSON.stringify(walletsToLoad, null, 2));
        return await this.coreRpcService.loadWallets(walletsToLoad);
    }


    /**
     * Yucky, but very quick means to ensure single run tasks for various tasks have occurred
    */
    private async enforceSingleRunTasks(): Promise<void> {
        const foundSettings: resources.Setting[] = await this.settingService.findAllByKey(SettingValue.SCRIPT_TASK_MIGRATION)
            .then(value => value.toJSON())
            .catch(() => []);

        const TASK_COUNT = 1;
        const settingID = (foundSettings.length > 0) && (+foundSettings[0].id > 0) ? foundSettings[0].id : 0;
        const tasksRun: number = (foundSettings.length > 0) && foundSettings[0] && (+foundSettings[0].value >= 0) ? +foundSettings[0].value : 0;
        let requiresUpdate = tasksRun < TASK_COUNT;

        // tslint:disable:no-small-switch
        switch (tasksRun) {
            case 0:
                // once-off fix for joined market keys having been removed from particl-core when the equivalent promoted market expires
                this.log.info('Running once-off task 0...');
                const marketslist: resources.Market[] = await this.marketService.findAll().then(value => value.toJSON()).catch(() => []);
                for (const market of marketslist) {
                    if (market.Identity && market.Profile) {
                        await this.marketService.importMarketKeys(market, false).catch((err) => {
                            /* do nothing for now - might fail because it already exists */
                        });
                    }
                }
                // for further tasks, remove the break here to let fallthrough to the next case statement occur; except last statement
                break;
            default:
                requiresUpdate = false;
        }
        // tslint:enable:no-small-switch

        if (requiresUpdate) {
            if (settingID > 0) {
                await this.settingService.update(
                    settingID,
                    {
                        key: SettingValue.SCRIPT_TASK_MIGRATION.toString(),
                        value: '' + TASK_COUNT
                    } as SettingUpdateRequest
                ).catch(() => null);
            } else {
                await this.settingService.create({
                    key: SettingValue.SCRIPT_TASK_MIGRATION.toString(),
                    value: '' + TASK_COUNT
                } as SettingCreateRequest).catch(() => null);
            }
        }
    }

}
