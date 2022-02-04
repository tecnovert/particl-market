// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { SmsgMessageStatus } from '../../api/enums/SmsgMessageStatus';
import { ActionMessageTypes } from '../../api/enums/ActionMessageTypes';
import { ActionDirection } from '../../api/enums/ActionDirection';

declare module 'resources' {

    interface SmsgMessage {
        // these fields are in the incoming message
        msgid: string;
        version: string;
        read: boolean;
        paid: boolean;
        payloadsize: number;
        received: number;
        sent: number;
        expiration: number;
        daysretention: number;
        from: string;
        to: string;
        text: string; // this should propably be cleared after message has been succesfully processed

        // model also has these
        id: number;
        type: ActionMessageTypes;
        status: SmsgMessageStatus;
        direction: ActionDirection;
        target: string;

        processedCount: number;
        processedAt: number;

        createdAt: number;
        updatedAt: number;
    }

}
