// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { Bookshelf } from '../../config/Database';
import { Profile } from './Profile';


export class Address extends Bookshelf.Model<Address> {

    public static async fetchById(value: number, withRelated: boolean = true): Promise<Address> {
        if (withRelated) {
            return await Address.where<Address>({ id: value }).fetch({
                withRelated: [
                    'Profile'
                ]
            });
        } else {
            return await Address.where<Address>({ id: value }).fetch();
        }
    }

    public get tableName(): string { return 'addresses'; }
    public get hasTimestamps(): boolean { return true; }

    public get Id(): number { return this.get('id'); }
    public set Id(value: number) { this.set('id', value); }

    public get FirstName(): string { return this.get('first_name'); }
    public set FirstName(value: string) { this.set('first_name', value); }

    public get LastName(): string { return this.get('last_name'); }
    public set LastName(value: string) { this.set('last_name', value); }

    public get Title(): string { return this.get('title'); }
    public set Title(value: string) { this.set('title', value); }

    public get AddressLine1(): string { return this.get('address_line1'); }
    public set AddressLine1(value: string) { this.set('address_line1', value); }

    public get AddressLine2(): string { return this.get('address_line2'); }
    public set AddressLine2(value: string) { this.set('address_line2', value); }

    public get City(): string { return this.get('city'); }
    public set City(value: string) { this.set('city', value); }

    public get State(): string { return this.get('state'); }
    public set State(value: string) { this.set('state', value); }

    public get Country(): string { return this.get('country'); }
    public set Country(value: string) { this.set('country', value); }

    public get ZipCode(): string { return this.get('zip_code'); }
    public set ZipCode(value: string) { this.set('zip_code', value); }

    public get Type(): string { return this.get('type'); }
    public set Type(value: string) { this.set('type', value); }

    public get UpdatedAt(): Date { return this.get('updatedAt'); }
    public set UpdatedAt(value: Date) { this.set('updatedAt', value); }

    public get CreatedAt(): Date { return this.get('createdAt'); }
    public set CreatedAt(value: Date) { this.set('createdAt', value); }

    public Profile(): Profile {
        return this.belongsTo(Profile, 'profile_id', 'id');
    }

}
