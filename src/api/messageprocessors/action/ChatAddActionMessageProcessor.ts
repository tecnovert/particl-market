// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../../core/Logger';
import { SmsgMessageService } from '../../services/model/SmsgMessageService';
import { ChatAddActionService } from '../../services/action/ChatAddActionService';
import { Types, Core, Targets } from '../../../constants';
import { MarketplaceMessageEvent } from '../../messages/MarketplaceMessageEvent';
import { MessageProcessorInterface } from '../MessageProcessorInterface';
import { CommentAction } from '../../enums/CommentAction';
import { SmsgMessageStatus } from '../../enums/SmsgMessageStatus';


export class ChatAddActionMessageProcessor implements MessageProcessorInterface {

    public log: LoggerType;

    constructor(
        @inject(Types.Service) @named(Targets.Service.model.SmsgMessageService) public smsgMessageService: SmsgMessageService,
        @inject(Types.Service) @named(Targets.Service.action.ChatAddActionService) public actionService: ChatAddActionService,
        @inject(Types.Core) @named(Core.Logger) Logger: typeof LoggerType
    ) {
        this.log = new Logger(CommentAction.MPA_CHAT_MESSAGE_ADD);
    }


    public async process(event: MarketplaceMessageEvent): Promise<void> {
        const msgid = event && event.smsgMessage && event.smsgMessage.msgid ? event.smsgMessage.msgid : '';
        const success = await this.actionService.receiveMessage(event)
            .catch(err => {
                this.log.error('Incoming chat messsage receive error: ', err);
                return false;
            });

        if (!success) {
            this.log.warn(
                `skipping incoming chat message: ${ msgid.length > 0 ? msgid : 'unknown msgid'}`
            );

            // no point to storing the failed smsg...
            if (msgid.length > 0) {
                await this.smsgMessageService.destroy(event.smsgMessage.id).catch(er => null);
            }

            return;
        }

        // updating the status and keeping the smsg allows the MP currently to fail early in adding the same successfully processed message on a rescan
        await this.smsgMessageService.updateStatus(event.smsgMessage.id, SmsgMessageStatus.PROCESSED).catch(() => null);
    }


}
