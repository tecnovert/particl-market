// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

declare module 'resources' {

    interface ListingItem {
        id: number;
        msgid: string;
        hash: string;
        seller: string;
        signature: string;
        market: string;
        expiryTime: number;
        generatedAt: number;
        removed: boolean;
        receivedAt: number;
        postedAt: number;
        expiredAt: number;

        ItemInformation: ItemInformation;
        PaymentInformation: PaymentInformation;
        MessagingInformation: MessagingInformation[];
        ListingItemObjects: ListingItemObject[];
        Bids: Bid[];
        ListingItemTemplate: ListingItemTemplate;
        FlaggedItem: FlaggedItem;
        FavoriteItems: FavoriteItem[];
        ShoppingCartItem: ShoppingCartItem[];

        createdAt: Date;
        updatedAt: Date;
    }

}
