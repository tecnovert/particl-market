// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { Bookshelf } from '../../config/Database';
import { Collection, Model } from 'bookshelf';
import { Logger as LoggerType } from '../../core/Logger';
import { ItemCategorySearchParams } from '../requests/search/ItemCategorySearchParams';

export class ItemCategory extends Bookshelf.Model<ItemCategory> {

    public static log: LoggerType = new LoggerType(__filename);

    public static RELATIONS = [
        'ParentItemCategory',
        'ParentItemCategory.ParentItemCategory',
        'ParentItemCategory.ParentItemCategory.ParentItemCategory',
        'ParentItemCategory.ParentItemCategory.ParentItemCategory.ParentItemCategory',
        'ChildItemCategories'
    ];

    public static CHILD_RELATIONS = [
        'ParentItemCategory',
        'ChildItemCategories',
        'ChildItemCategories.ChildItemCategories',
        'ChildItemCategories.ChildItemCategories.ChildItemCategories',
        'ChildItemCategories.ChildItemCategories.ChildItemCategories.ChildItemCategories'
    ];

    public static async fetchById(value: number, withRelated: boolean = true, parentRelations: boolean = true): Promise<ItemCategory> {
        if (withRelated) {
            return await ItemCategory.where<ItemCategory>({ id: value }).fetch({
                withRelated: parentRelations ? this.RELATIONS : this.CHILD_RELATIONS
            });
        } else {
            return await ItemCategory.where<ItemCategory>({ id: value }).fetch();
        }
    }

    public static async fetchByKeyAndMarket(key: string, market: string, withRelated: boolean = true, parentRelations: boolean = true): Promise<ItemCategory> {
        const collection: Collection<ItemCategory> = await this.searchBy({
            market,
            key
        } as ItemCategorySearchParams, withRelated, parentRelations);

        return collection.first();
    }

    public static async fetchDefaultByKey(key: string, withRelated: boolean = true, parentRelations: boolean = true): Promise<ItemCategory> {
        const collection: Collection<ItemCategory> = await this.searchBy({
            key,
            isDefault: true
        } as ItemCategorySearchParams, withRelated, parentRelations);

        return collection.first();
    }

    public static async fetchRoot(market?: string, withRelated: boolean = true, parentRelations: boolean = false): Promise<ItemCategory> {
        const params = {
            market,
            isRoot: true,
            isDefault: !!market
        } as ItemCategorySearchParams;
        // this.log.debug('fetchRoot, params:', JSON.stringify(params, null, 2));

        // parentRelations = false, returns the child relations, so its easier to build the category tree
        const collection: Collection<ItemCategory> = await this.searchBy(params, withRelated, parentRelations);
        return collection.first();
    }

    public static async fetchDefaultRoot(withRelated: boolean = true, parentRelations: boolean = false): Promise<ItemCategory> {
        const params = {
            isRoot: true,
            isDefault: true
        } as ItemCategorySearchParams;
        // this.log.debug('fetchDefaultRoot, params:', JSON.stringify(params, null, 2));

        const collection: Collection<ItemCategory> = await this.searchBy(params, withRelated, parentRelations);
        return collection.first();
    }

    public static async searchBy(
        options: ItemCategorySearchParams,
        withRelated: boolean = false,
        parentRelations: boolean = true
    ): Promise<Collection<ItemCategory>> {
        const collection = ItemCategory.forge<Model<ItemCategory>>()
            .query(qb => {
                if (options.market) {
                    qb.where('item_categories.market', '=', options.market);
                } else if (!options.market && options.isDefault) {
                    qb.whereNull('item_categories.market');
                }

                if (options.parentId) {
                    qb.where('item_categories.parent_item_category_id', '=', options.parentId);
                } else if (!options.parentId && options.isRoot) {
                    qb.whereNull('item_categories.parent_item_category_id');
                }

                if (options.key) {
                    qb.where('item_categories.key', '=', options.key);
                }
                if (options.name) {
                    qb.where('item_categories.name', 'LIKE', '%' + options.name + '%');
                }

            })
            .orderBy('id', 'ASC');

        if (withRelated) {
            return await collection.fetchAll({
                withRelated: parentRelations ? this.RELATIONS : this.CHILD_RELATIONS
            });
        } else {
            return await collection.fetchAll();
        }
    }

    public get tableName(): string { return 'item_categories'; }
    public get hasTimestamps(): boolean { return true; }

    public get Id(): number { return this.get('id'); }
    public set Id(value: number) { this.set('id', value); }

    public get Name(): string { return this.get('name'); }
    public set Name(value: string) { this.set('name', value); }

    public get Market(): string { return this.get('market'); }
    public set Market(value: string) { this.set('market', value); }

    public get Key(): string { return this.get('key'); }
    public set Key(value: string) { this.set('key', value); }

    public get Description(): string { return this.get('description'); }
    public set Description(value: string) { this.set('description', value); }

    public get UpdatedAt(): Date { return this.get('updatedAt'); }
    public set UpdatedAt(value: Date) { this.set('updatedAt', value); }

    public get CreatedAt(): Date { return this.get('createdAt'); }
    public set CreatedAt(value: Date) { this.set('createdAt', value); }

    // ItemCategory can haz a parent ItemCategory
    public ParentItemCategory(): ItemCategory {
        // model.hasOne(Target, [foreignKey], [foreignKeyTarget])
        // return this.hasOne(ItemCategory, 'parent_item_category_id', 'id');
        // model.belongsTo(Target, [foreignKey], [foreignKeyTarget])
        return this.belongsTo(ItemCategory, 'parent_item_category_id', 'id');
    }

    public ChildItemCategories(): Collection<ItemCategory> {
        // model.hasMany(Target, [foreignKey], [foreignKeyTarget])
        return this.hasMany(ItemCategory, 'parent_item_category_id', 'id');
    }
}
