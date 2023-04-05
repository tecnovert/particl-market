// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

declare module 'resources' {

    interface ItemInformation {
        id: number;
        title: string;
        shortDescription: string;
        longDescription: string;
        productCode: string;
        createdAt: Date;
        updatedAt: Date;
        ShippingDestinations: ShippingDestination[];
        ItemCategory: ItemCategory;
        Images: Image[];
        ItemLocation: ItemLocation;
        ListingItem: ListingItem;
        ListingItemTemplate: ListingItemTemplate;
    }

}
