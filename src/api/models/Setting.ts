// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { Bookshelf } from '../../config/Database';
import { Collection, Model } from 'bookshelf';
import { Profile } from './Profile';
import { Market } from './Market';

export class Setting extends Bookshelf.Model<Setting> {

    public static RELATIONS = [
        'Profile',
        'Market'
    ];

    public static async fetchAllByProfileId(profileId: number, withRelated: boolean = true): Promise<Collection<Setting>> {
        const collection = Setting.forge<Model<Setting>>()
            .query(qb => {
                qb.where('profile_id', '=', profileId);
            })
            .orderBy('id', 'ASC');

        return collection.fetchAll(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public static async fetchAllByMarketId(marketId: number, withRelated: boolean = true): Promise<Collection<Setting>> {
        const collection = Setting.forge<Model<Setting>>()
            .query(qb => {
                qb.where('market_id', '=', marketId);
            })
            .orderBy('id', 'ASC');

        return collection.fetchAll(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public static async fetchAllByProfileIdAndMarketId(profileId: number, marketId: number, withRelated: boolean = true): Promise<Collection<Setting>> {
        const collection = Setting.forge<Model<Setting>>()
            .query(qb => {
                qb.where('market_id', '=', marketId);
                qb.andWhere('profile_id', '=', profileId);
            })
            .orderBy('id', 'ASC');

        return collection.fetchAll(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public static async fetchAllByKeyAndProfileId(key: string, profileId: number, withRelated: boolean = true): Promise<Collection<Setting>> {
        const collection = Setting.forge<Model<Setting>>()
            .query(qb => {
                qb.where('key', '=', key);
                qb.andWhere('profile_id', '=', profileId);
            })
            .orderBy('id', 'ASC');

        return collection.fetchAll(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public static async fetchAllByKey(key: string, withRelated: boolean = true): Promise<Collection<Setting>> {
        const collection = Setting.forge<Model<Setting>>()
            .query(qb => {
                qb.where('key', '=', key);
            })
            .orderBy('id', 'ASC');

        return collection.fetchAll(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public static async fetchByKeyAndProfileIdAndMarketId(key: string, profileId: number, marketId: number, withRelated: boolean = true): Promise<Setting> {
        return Setting.where<Setting>({ key, profile_id: profileId, market_id: marketId }).fetch(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public static async fetchById(value: number, withRelated: boolean = true): Promise<Setting> {
        return Setting.where<Setting>({ id: value }).fetch(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }


    public get tableName(): string { return 'settings'; }
    public get hasTimestamps(): boolean { return true; }

    public get Id(): number { return this.get('id'); }
    public set Id(value: number) { this.set('id', value); }

    public get Key(): string { return this.get('key'); }
    public set Key(value: string) { this.set('key', value); }

    public get Value(): string { return this.get('value'); }
    public set Value(value: string) { this.set('value', value); }

    public get UpdatedAt(): Date { return this.get('updatedAt'); }
    public set UpdatedAt(value: Date) { this.set('updatedAt', value); }

    public get CreatedAt(): Date { return this.get('createdAt'); }
    public set CreatedAt(value: Date) { this.set('createdAt', value); }

    public Profile(): Profile {
        return this.belongsTo(Profile, 'profile_id', 'id');
    }

    public Market(): Market {
        return this.belongsTo(Market, 'market_id', 'id');
    }

}
