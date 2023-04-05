// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

declare module 'resources' {

    interface ListingItemTemplate {
        id: number;
        hash: string;
        market: string;
        generatedAt: number;
        ItemInformation: ItemInformation;
        PaymentInformation: PaymentInformation;
        MessagingInformation: MessagingInformation[];
        ListingItemObjects: ListingItemObject[];
        ListingItems: ListingItem[];
        Profile: Profile;
        ParentListingItemTemplate: ListingItemTemplate;
        ChildListingItemTemplates: ListingItemTemplate[];

        createdAt: Date;
        updatedAt: Date;
    }

}
