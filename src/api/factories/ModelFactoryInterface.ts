// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as resources from 'resources';
import { ModelCreateParams } from './ModelCreateParams';
import { ActionMessageInterface } from '../messages/action/ActionMessageInterface';
import { ModelRequestInterface } from '../requests/model/ModelRequestInterface';

/**
 * ModelFactoryInterface defines how the Factory classes for the CreateRequests should be implemented
 */
export interface ModelFactoryInterface {
    // TODO: models are propably most often created from messages, so ModelCreateParams could most likely be dropped...
    get(params: ModelCreateParams, actionMessage?: ActionMessageInterface, smsgMessage?: resources.SmsgMessage): Promise<ModelRequestInterface>;
}
