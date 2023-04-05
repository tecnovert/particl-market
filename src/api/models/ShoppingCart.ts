// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { Bookshelf } from '../../config/Database';
import { Collection, Model } from 'bookshelf';
import { Identity } from './Identity';
import { ShoppingCartItem } from './ShoppingCartItem';

export class ShoppingCart extends Bookshelf.Model<ShoppingCart> {

    public static RELATIONS = [
        'Identity',
        'ShoppingCartItems',
        'ShoppingCartItems.ListingItem'
    ];

    public static async fetchById(value: number, withRelated: boolean = true): Promise<ShoppingCart> {
        return await ShoppingCart.where<ShoppingCart>({ id: value }).fetch({
            withRelated: withRelated ? this.RELATIONS : undefined
        });
    }

    public static async fetchAllByIdentityId(value: number, withRelated: boolean = false): Promise<Collection<ShoppingCart>> {
        const shoppingCart = ShoppingCart.forge<Model<ShoppingCart>>()
            .query(qb => {
                qb.where('identity_id', '=', value);
            }).orderBy('id', 'ASC');

        return await shoppingCart.fetchAll({
            withRelated: withRelated ? this.RELATIONS : undefined
        });
    }

    public get tableName(): string { return 'shopping_carts'; }
    public get hasTimestamps(): boolean { return true; }

    public get Id(): number { return this.get('id'); }
    public set Id(value: number) { this.set('id', value); }

    public get Name(): string { return this.get('name'); }
    public set Name(value: string) { this.set('name', value); }

    public get UpdatedAt(): Date { return this.get('updatedAt'); }
    public set UpdatedAt(value: Date) { this.set('updatedAt', value); }

    public get CreatedAt(): Date { return this.get('createdAt'); }
    public set CreatedAt(value: Date) { this.set('createdAt', value); }

    public Identity(): Identity {
        return this.belongsTo(Identity, 'identity_id', 'id');
    }

    public ShoppingCartItems(): Collection<ShoppingCartItem> {
        return this.hasMany(ShoppingCartItem, 'shopping_cart_id', 'id');
    }
}
