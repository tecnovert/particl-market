// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { MPA } from '@zasmilingidiot/omp-lib/dist/interfaces/omp';
import { ActionMessageTypes } from '../../enums/ActionMessageTypes';
import {KVS} from '@zasmilingidiot/omp-lib/dist/interfaces/common';


export interface ActionMessageInterface extends Omit<MPA, 'type'> {
    type: ActionMessageTypes;
    generated: number;
    hash: string;
    objects?: KVS[];
}
