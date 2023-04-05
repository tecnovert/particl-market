// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

declare module 'resources' {

    interface Profile {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;

        ShippingAddresses: Address[];
        CryptocurrencyAddresses: CryptocurrencyAddress[];
        FavoriteItems: FavoriteItem[];
        Markets: Market[];
        Identities: Identity[];
        Settings: Setting[];
        Notifications: Notification[];
    }

}
