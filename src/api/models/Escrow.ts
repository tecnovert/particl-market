// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { Bookshelf } from '../../config/Database';
import { EscrowRatio } from './EscrowRatio';

export class Escrow extends Bookshelf.Model<Escrow> {

    public static RELATIONS = [
        'Ratio'
    ];

    public static async fetchById(value: number, withRelated: boolean = true): Promise<Escrow> {
        if (withRelated) {
            return await Escrow.where<Escrow>({ id: value }).fetch({
                withRelated: this.RELATIONS
            });
        } else {
            return await Escrow.where<Escrow>({ id: value }).fetch();
        }
    }

    public get tableName(): string { return 'escrows'; }
    public get hasTimestamps(): boolean { return true; }

    public get Id(): number { return this.get('id'); }
    public set Id(value: number) { this.set('id', value); }

    public get Type(): string { return this.get('type'); }
    public set Type(value: string) { this.set('type', value); }

    public get SecondsToLock(): number { return this.get('seconds_to_lock'); }
    public set SecondsToLock(value: number) { this.set('seconds_to_lock', value); }

    public get ReleaseType(): string { return this.get('release_type'); }
    public set ReleaseType(value: string) { this.set('release_type', value); }

    public get UpdatedAt(): Date { return this.get('updatedAt'); }
    public set UpdatedAt(value: Date) { this.set('updatedAt', value); }

    public get CreatedAt(): Date { return this.get('createdAt'); }
    public set CreatedAt(value: Date) { this.set('createdAt', value); }

    public Ratio(): EscrowRatio {
        return this.hasOne(EscrowRatio);
    }
}
