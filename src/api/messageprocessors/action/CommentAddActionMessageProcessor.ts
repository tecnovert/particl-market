// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as resources from 'resources';
import { inject, named } from 'inversify';
import { Types, Core, Targets } from '../../../constants';
import { Logger as LoggerType } from '../../../core/Logger';
import { SmsgMessageStatus } from '../../enums/SmsgMessageStatus';
import { MarketplaceMessageEvent } from '../../messages/MarketplaceMessageEvent';
import { SmsgMessageService } from '../../services/model/SmsgMessageService';
import { MarketplaceMessage } from '../../messages/MarketplaceMessage';
import { ActionMessageProcessorInterface } from '../ActionMessageProcessorInterface';
import { BaseActionMessageProcessor } from '../BaseActionMessageProcessor';
import { BidService } from '../../services/model/BidService';
import { CommentAction } from '../../enums/CommentAction';
import { CommentService } from '../../services/model/CommentService';
import { CommentAddActionService } from '../../services/action/CommentAddActionService';
import { ProposalService } from '../../services/model/ProposalService';
// import { CommentAddMessage } from '../../messages/action/CommentAddMessage';
import { CommentAddValidator } from '../../messagevalidators/CommentAddValidator';
import { ActionDirection } from '../../enums/ActionDirection';
import { NotificationService } from '../../services/model/NotificationService';


export class CommentAddActionMessageProcessor extends BaseActionMessageProcessor implements ActionMessageProcessorInterface {

    public static Event = Symbol(CommentAction.MPA_COMMENT_ADD);

    constructor(
        @inject(Types.Service) @named(Targets.Service.model.SmsgMessageService) public smsgMessageService: SmsgMessageService,
        @inject(Types.Service) @named(Targets.Service.model.BidService) public bidService: BidService,
        @inject(Types.Service) @named(Targets.Service.model.ProposalService) public proposalService: ProposalService,
        @inject(Types.Service) @named(Targets.Service.model.NotificationService) public notificationService: NotificationService,
        @inject(Types.Service) @named(Targets.Service.model.CommentService) public commentService: CommentService,
        @inject(Types.Service) @named(Targets.Service.action.CommentAddActionService) public actionService: CommentAddActionService,
        @inject(Types.MessageValidator) @named(Targets.MessageValidator.CommentAddValidator) public validator: CommentAddValidator,
        @inject(Types.Core) @named(Core.Logger) Logger: typeof LoggerType
    ) {
        super(CommentAction.MPA_COMMENT_ADD,
            actionService,
            smsgMessageService,
            bidService,
            proposalService,
            notificationService,
            validator,
            Logger
        );
    }

    /**
     * handles the received CommentAddMessage and returns SmsgMessageStatus as a result
     *
     * @param event
     */
    public async onEvent(event: MarketplaceMessageEvent): Promise<SmsgMessageStatus> {

        const smsgMessage: resources.SmsgMessage = event.smsgMessage;
        const marketplaceMessage: MarketplaceMessage = event.marketplaceMessage;
        // const actionMessage: CommentAddMessage = marketplaceMessage.action as CommentAddMessage;

        // processProposal will create or update the Proposal
        return await this.actionService.processMessage(marketplaceMessage, ActionDirection.INCOMING, smsgMessage)
            .then(value => {
                this.log.debug('==> PROCESSED COMMENT: ', value ? value.msgid : '');
                return SmsgMessageStatus.PROCESSED;
            })
            .catch(reason => {
                this.log.debug('==> COMMENT PROCESSING FAILED: ', reason);
                return SmsgMessageStatus.PROCESSING_FAILED;
            });
    }

}
