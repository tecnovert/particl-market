// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { BaseHashableConfig, HashableFieldConfig, HashableFieldValueConfig } from '@zasmilingidiot/omp-lib/dist/interfaces/configs';
import { HashableChatAddField } from '../HashableField';
import { HashableCommonField } from '@zasmilingidiot/omp-lib/dist/interfaces/omp-enums';

export class HashableChatAddMessageConfig extends BaseHashableConfig {

    public fields = [
        {
            from: 'generated',
            to: HashableCommonField.GENERATED
        }, {
            from: 'sender',
            to: HashableChatAddField.CHAT_SENDER
        }, {
            from: 'receiver',
            to: HashableChatAddField.CHAT_RECEIVER
        }, {
            from: 'channel',
            to: HashableChatAddField.CHAT_CHANNEL
        }, {
            from: 'message',
            to: HashableChatAddField.CHAT_MESSAGE
        }
    ] as HashableFieldConfig[];

    constructor(values?: HashableFieldValueConfig[]) {
        super(values);
    }
}
