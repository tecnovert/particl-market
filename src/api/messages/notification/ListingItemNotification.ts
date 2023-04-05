// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { ActionNotificationInterface } from './ActionNotificationInterface';

export class ListingItemNotification implements ActionNotificationInterface {
    public objectId: number;
    public objectHash: string;

    public from: string;    // was: seller
    public to: string;      // listing could be just a private offer to someone

    public market: string;
}
