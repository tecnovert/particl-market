// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { ActionNotificationInterface } from './ActionNotificationInterface';


export class MarketImageNotification implements ActionNotificationInterface {
    public objectId: number;
    public objectHash: string;

    public from: string;
    public to: string;

    public target: string;          // was: marketHash
}
