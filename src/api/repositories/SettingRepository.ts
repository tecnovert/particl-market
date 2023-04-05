// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Bookshelf from 'bookshelf';
import { inject, named } from 'inversify';
import { Types, Core, Targets } from '../../constants';
import { Setting } from '../models/Setting';
import { DatabaseException } from '../exceptions/DatabaseException';
import { NotFoundException } from '../exceptions/NotFoundException';
import { Logger as LoggerType } from '../../core/Logger';

export class SettingRepository {

    public log: LoggerType;

    constructor(
        @inject(Types.Model) @named(Targets.Model.Setting) public SettingModel: typeof Setting,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    public async findAll(): Promise<Bookshelf.Collection<Setting>> {
        const list = await this.SettingModel.fetchAll<Setting>();
        return list;
    }

    public async findAllByProfileId(profileId: number, withRelated: boolean = true): Promise<Bookshelf.Collection<Setting>> {
        return await this.SettingModel.fetchAllByProfileId(profileId, withRelated);
    }

    public async findAllByKeyAndProfileId(key: string, profileId: number, withRelated: boolean = true): Promise<Bookshelf.Collection<Setting>> {
        return await this.SettingModel.fetchAllByKeyAndProfileId(key, profileId, withRelated);
    }

    public async findAllByKey(key: string, withRelated: boolean = true): Promise<Bookshelf.Collection<Setting>> {
        return await this.SettingModel.fetchAllByKey(key, withRelated);
    }

    public async findAllByProfileIdAndMarketId(profileId: number, marketId: number, withRelated: boolean = true): Promise<Bookshelf.Collection<Setting>> {
        return await this.SettingModel.fetchAllByProfileIdAndMarketId(profileId, marketId, withRelated);
    }

    public async findOne(id: number, withRelated: boolean = true): Promise<Setting> {
        return await this.SettingModel.fetchById(id, withRelated);
    }

    public async findOneByKeyAndProfileIdAndMarketId(key: string, profileId: number, marketId: number, withRelated: boolean = true): Promise<Setting> {
        return await this.SettingModel.fetchByKeyAndProfileIdAndMarketId(key, profileId, marketId, withRelated);
    }

    public async create(data: any): Promise<Setting> {
        const setting = this.SettingModel.forge<Setting>(data);
        try {
            const settingCreated = await setting.save();
            return await this.SettingModel.fetchById(settingCreated.id);
        } catch (error) {
            throw new DatabaseException('Could not create the setting!', error);
        }
    }

    public async update(id: number, data: any): Promise<Setting> {
        const setting = this.SettingModel.forge<Setting>({ id });
        try {
            const settingUpdated = await setting.save(data, { patch: true });
            return await this.SettingModel.fetchById(settingUpdated.id);
        } catch (error) {
            throw new DatabaseException('Could not update the setting!', error);
        }
    }

    public async destroy(id: number): Promise<void> {
        let setting = this.SettingModel.forge<Setting>({ id });
        try {
            setting = await setting.fetch({ require: true });
        } catch (error) {
            throw new NotFoundException(id);
        }

        try {
            await setting.destroy();
            return;
        } catch (error) {
            throw new DatabaseException('Could not delete the setting!', error);
        }
    }

}
