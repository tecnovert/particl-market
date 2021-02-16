// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

declare module 'resources' {

    interface Setting {
        id: number;
        key: string;
        value: string;
        Profile: Profile;
        Market: Market;

        createdAt: Date;
        updatedAt: Date;
    }

}
