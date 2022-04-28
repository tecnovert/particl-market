// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { BaseObserverService } from './BaseObserverService';
import { ObserverStatus } from '../../enums/ObserverStatus';
import { CommentAction } from '../../enums/CommentAction';
import { ChatService } from '../model/ChatService';
import { SmsgMessageService } from '../model/SmsgMessageService';


export class ChatCleanupService extends BaseObserverService {

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.model.ChatService) private chatService: ChatService,
        @inject(Types.Service) @named(Targets.Service.model.SmsgMessageService) private smsgMessageService: SmsgMessageService
    ) {
        super(__filename, process.env.MARKETS_EXPIRED_INTERVAL * 60 * 1000, Logger);
    }

    /**
     * Find chat messages no longer relevant and remove them...
     *
     * @param currentStatus
     */
    public async run(currentStatus: ObserverStatus): Promise<ObserverStatus> {

        await this.chatService.cleanupParticipants();
        await this.chatService.cleanupChatChannels();

        await this.smsgMessageService.cleanupByType(CommentAction.MPA_CHAT_MESSAGE_ADD);

        return ObserverStatus.RUNNING;
    }

}
