// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

declare module 'resources' {

    interface ItemLocation {
        id: number;
        country: string;
        address: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        LocationMarker: LocationMarker;
        ItemInformation: ItemInformation;
    }

}
