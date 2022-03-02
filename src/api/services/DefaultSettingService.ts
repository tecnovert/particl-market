// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import * as resources from 'resources';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../core/Logger';
import { Types, Core, Targets } from '../../constants';
import { CoreRpcService } from './CoreRpcService';
import { SettingService } from './model/SettingService';
import { SettingUpdateRequest } from '../requests/model/SettingUpdateRequest';
import { SettingCreateRequest } from '../requests/model/SettingCreateRequest';
import { SettingValue } from '../enums/SettingValue';

export class DefaultSettingService {

    public log: LoggerType;

    constructor(
        @inject(Types.Service) @named(Targets.Service.model.SettingService) public settingService: SettingService,
        @inject(Types.Service) @named(Targets.Service.CoreRpcService) public coreRpcService: CoreRpcService,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    /**
     * saves/updates the default market env vars as Settings
     *
     * @param defaultProfile
     */
    public async saveDefaultSettings(defaultProfile: resources.Profile): Promise<resources.Setting[]> {

        const settings: resources.Setting[] = [];
        return settings;
    }

    public async upgradeDefaultSettings(): Promise<void> {
        // remove all "DEFAULT_WALLETS"
        const foundSettings: resources.Setting[] = await this.settingService.findAllByKey('DEFAULT_WALLET').then(value => value.toJSON());
        for (const setting of foundSettings) {
            await this.settingService.destroy(setting.id);
        }
    }

    /**
     * updates the default profile id Setting
     *
     * @param profileId
     */
    public async insertOrUpdateDefaultProfileSetting(profileId: number): Promise<resources.Setting> {
        // retrieve the default Profile id, if it exists
        const foundSettings: resources.Setting[] = await this.settingService.findAllByKey(SettingValue.APP_DEFAULT_PROFILE_ID).then(value => value.toJSON());
        const defaultProfileIdSetting = foundSettings[0];

        // undefined if default profile is not set yet. if set already, update, if not set, create
        if (_.isEmpty(defaultProfileIdSetting)) {
            return await this.settingService.create({
                key: SettingValue.APP_DEFAULT_PROFILE_ID.toString(),
                value: '' + profileId
            } as SettingCreateRequest).then(value => value.toJSON());

        } else {
            return await this.settingService.update(defaultProfileIdSetting.id, {
                key: SettingValue.APP_DEFAULT_PROFILE_ID.toString(),
                value: '' + profileId
            } as SettingUpdateRequest).then(value => value.toJSON());
        }
    }

}
