// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import { MarketplaceMessage } from '../messages/MarketplaceMessage';
import { ValidationException } from '../exceptions/ValidationException';
import { ActionMessageValidatorInterface } from './ActionMessageValidatorInterface';
import { inject, named } from 'inversify';
// import { ActionDirection } from '../enums/ActionDirection';
import { Core, Targets, Types } from '../../constants';
import { Logger as LoggerType } from '../../core/Logger';
import { CoreRpcService } from '../services/CoreRpcService';
import { MarketService } from '../services/model/MarketService';
import { MPActionExtended } from '../enums/MPActionExtended';
import { ImageService } from '../services/model/ImageService';
import { MarketImageAddMessage } from '../messages/action/MarketImageAddMessage';
import { MissingParamException } from '../exceptions/MissingParamException';
import { InvalidParamException } from '../exceptions/InvalidParamException';

export class MarketImageAddValidator implements ActionMessageValidatorInterface {

    public log: LoggerType;

    constructor(
        @inject(Types.Service) @named(Targets.Service.CoreRpcService) public coreRpcService: CoreRpcService,
        @inject(Types.Service) @named(Targets.Service.model.MarketService) public marketService: MarketService,
        @inject(Types.Service) @named(Targets.Service.model.ImageService) public imageService: ImageService,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    /**
     * called before posting (BaseActionService.post) and after receiving (BaseActionMessageProcessor.process) the message
     * to make sure the message contents are valid
     *
     * @param message
     * @param direction
     */
    public async validateMessage(message: MarketplaceMessage /* , direction: ActionDirection */): Promise<boolean> {

        const actionMessage = message.action as MarketImageAddMessage;
        // this.log.debug('actionMessage:', JSON.stringify(actionMessage, null, 2));

        if (actionMessage.type !== MPActionExtended.MPA_MARKET_IMAGE_ADD) {
            throw new ValidationException('Invalid action type.', ['Accepting only ' + MPActionExtended.MPA_MARKET_IMAGE_ADD]);
        }

        if (_.isNil(actionMessage.hash)) {
            throw new MissingParamException('hash');
        }

        if (_.isNil(actionMessage.data)) {
            throw new MissingParamException('data');
        }

        if (!_.isArray(actionMessage.data)) {
            throw new InvalidParamException('data', 'DSN[]');
        }

        if (_.isNil(actionMessage.target)) {
            throw new MissingParamException('target');
        }

        if (_.isNil(actionMessage.generated)) {
            throw new MissingParamException('generated');
        }

        return true;
    }

    public async validateSequence(/* message: MarketplaceMessage, direction: ActionDirection */): Promise<boolean> {
        return true;
    }

}
