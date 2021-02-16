// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { Bookshelf } from '../../config/Database';
import { Collection } from 'bookshelf';
import { ItemLocation } from './ItemLocation';
import { Image } from './Image';
import { ShippingDestination } from './ShippingDestination';
import { ItemCategory } from './ItemCategory';
import { ListingItemTemplate } from './ListingItemTemplate';
import { ListingItem } from './ListingItem';

export class ItemInformation extends Bookshelf.Model<ItemInformation> {

    public static RELATIONS = [
        'ItemCategory',
        'ItemLocation',
        'ItemLocation.LocationMarker',
        'Images',
        'Images.ImageDatas',
        'ShippingDestinations'
    ];

    public static async fetchById(value: number, withRelated: boolean = true): Promise<ItemInformation> {
        return ItemInformation.where<ItemInformation>({ id: value }).fetch(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public static async findByItemTemplateId(value: number, withRelated: boolean = true): Promise<ItemInformation> {
        return ItemInformation.where<ItemInformation>({ listing_item_template_id: value }).fetch(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public get tableName(): string { return 'item_informations'; }
    public get hasTimestamps(): boolean { return true; }

    public get Id(): number { return this.get('id'); }
    public set Id(value: number) { this.set('id', value); }

    public get Title(): string { return this.get('title'); }
    public set Title(value: string) { this.set('title', value); }

    public get ShortDescription(): string { return this.get('shortDescription'); }
    public set ShortDescription(value: string) { this.set('shortDescription', value); }

    public get LongDescription(): string { return this.get('longDescription'); }
    public set LongDescription(value: string) { this.set('longDescription', value); }

    public get UpdatedAt(): Date { return this.get('updatedAt'); }
    public set UpdatedAt(value: Date) { this.set('updatedAt', value); }

    public get CreatedAt(): Date { return this.get('createdAt'); }
    public set CreatedAt(value: Date) { this.set('createdAt', value); }

    public ItemCategory(): ItemCategory {
        return this.belongsTo(ItemCategory, 'item_category_id', 'id');
    }

    public ItemLocation(): ItemLocation {
        return this.hasOne(ItemLocation);
    }

    public Images(): Collection<Image> {
        return this.hasMany(Image, 'item_information_id', 'id');
    }

    public ShippingDestinations(): Collection<ShippingDestination> {
        return this.hasMany(ShippingDestination, 'item_information_id', 'id');
    }

    public ListingItemTemplate(): ListingItemTemplate {
        return this.belongsTo(ListingItemTemplate, 'listing_item_template_id', 'id');
    }

    public ListingItem(): ListingItem {
        return this.belongsTo(ListingItem, 'listing_item_id', 'id');
    }

}
