// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import * as resources from 'resources';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../../core/Logger';
import { Core, Targets, Types } from '../../../constants';
import { SmsgService } from '../SmsgService';
import { MarketplaceMessage } from '../../messages/MarketplaceMessage';
import { SmsgSendResponse } from '../../responses/SmsgSendResponse';
import { CoreRpcService } from '../CoreRpcService';
import { SmsgMessageService } from '../model/SmsgMessageService';
import { BaseActionService } from '../BaseActionService';
import { SmsgMessageFactory } from '../../factories/model/SmsgMessageFactory';
import { CommentAddRequest } from '../../requests/action/CommentAddRequest';
import { CommentAddMessage } from '../../messages/action/CommentAddMessage';
import { CommentAddMessageFactory } from '../../factories/message/CommentAddMessageFactory';
import { CommentService } from '../model/CommentService';
import { CommentCreateRequest } from '../../requests/model/CommentCreateRequest';
import { CommentCreateParams } from '../../factories/ModelCreateParams';
import { CommentFactory } from '../../factories/model/CommentFactory';
import { CommentAddValidator } from '../../messagevalidators/CommentAddValidator';
import { MarketplaceNotification } from '../../messages/MarketplaceNotification';
import { NotifyService } from '../NotifyService';
import { IdentityService } from '../model/IdentityService';
import { ActionDirection } from '../../enums/ActionDirection';
import { CommentAddNotification } from '../../messages/notification/CommentAddNotification';
import { CommentAction } from '../../enums/CommentAction';
import { BlacklistService } from '../model/BlacklistService';


export class CommentAddActionService extends BaseActionService {

    /* eslint-disable max-params */
    constructor(
        @inject(Types.Service) @named(Targets.Service.SmsgService) public smsgService: SmsgService,
        @inject(Types.Service) @named(Targets.Service.CoreRpcService) public coreRpcService: CoreRpcService,
        @inject(Types.Service) @named(Targets.Service.NotifyService) public notificationService: NotifyService,
        @inject(Types.Service) @named(Targets.Service.model.SmsgMessageService) public smsgMessageService: SmsgMessageService,
        @inject(Types.Service) @named(Targets.Service.model.IdentityService) private identityService: IdentityService,
        @inject(Types.Service) @named(Targets.Service.model.CommentService) public commentService: CommentService,
        @inject(Types.Service) @named(Targets.Service.model.BlacklistService) public blacklistService: BlacklistService,
        @inject(Types.Factory) @named(Targets.Factory.model.SmsgMessageFactory) public smsgMessageFactory: SmsgMessageFactory,
        @inject(Types.Factory) @named(Targets.Factory.model.CommentFactory) private commentFactory: CommentFactory,
        @inject(Types.Factory) @named(Targets.Factory.message.CommentAddMessageFactory) private actionMessageFactory: CommentAddMessageFactory,
        @inject(Types.MessageValidator) @named(Targets.MessageValidator.CommentAddValidator) public validator: CommentAddValidator,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        super(CommentAction.MPA_COMMENT_ADD,
            smsgService,
            smsgMessageService,
            notificationService,
            blacklistService,
            smsgMessageFactory,
            validator,
            Logger
        );
    }
    /* eslint-enable max-params */

    /**
     * create the MarketplaceMessage to which is to be posted to the network
     *
     * @param actionRequest
     */
    public async createMarketplaceMessage(actionRequest: CommentAddRequest): Promise<MarketplaceMessage> {
        return await this.actionMessageFactory.get(actionRequest);
    }

    /**
     * called before post is executed and message is sent
     *
     * @param actionRequest
     * @param marketplaceMessage
     */
    public async beforePost(actionRequest: CommentAddRequest, marketplaceMessage: MarketplaceMessage): Promise<MarketplaceMessage> {
        this.log.debug('marketplaceMessage:', JSON.stringify(marketplaceMessage, null, 2));
        return marketplaceMessage;
    }


    /**
     * called after post is executed and message is sent
     *
     * @param actionRequest
     * @param marketplaceMessage
     * @param smsgMessage
     * @param smsgSendResponse
     */
    public async afterPost(
        actionRequest: CommentAddRequest,
        marketplaceMessage: MarketplaceMessage,
        smsgMessage: resources.SmsgMessage,
        smsgSendResponse: SmsgSendResponse
    ): Promise<SmsgSendResponse> {

        return smsgSendResponse;
    }

    /**
     * called after posting a message and after receiving it
     *
     * processMessage "processes" the Message (ListingItemAdd/Bid/ProposalAdd/Vote/etc), often creating and/or updating
     * the whatever we're "processing" here.
     *
     * @param marketplaceMessage
     * @param actionDirection
     * @param smsgMessage
     * @param actionRequest, undefined when called from onEvent
     */
    public async processMessage(
        marketplaceMessage: MarketplaceMessage,
        actionDirection: ActionDirection,
        smsgMessage: resources.SmsgMessage
        // actionRequest?: CommentAddRequest
    ): Promise<resources.SmsgMessage> {

        const commentAddMessage: CommentAddMessage = marketplaceMessage.action as CommentAddMessage;

        let parentCommentId;
        if (commentAddMessage.parentCommentHash) {
            parentCommentId = await this.commentService.findOneByHash(commentAddMessage.parentCommentHash)
                .then(value => value.toJSON().id);
        }
        this.log.debug('processMessage(), commentAddMessage.hash: ', commentAddMessage.hash);

        const comment: resources.Comment = await this.commentService.findOneByHash(commentAddMessage.hash)
            .then(value => value.toJSON())
            .catch(async () => {
                // if Comment doesnt exist yet, we need to create it.

                this.log.debug('marketplaceMessage:', JSON.stringify(marketplaceMessage, null, 2));

                const commentCreateRequest: CommentCreateRequest = await this.commentFactory.get({
                    actionMessage: commentAddMessage,
                    smsgMessage,
                    parentCommentId
                } as CommentCreateParams) as CommentCreateRequest;

                this.log.debug('processMessage(), commentCreateRequest.hash: ', commentCreateRequest.hash);

                return await this.commentService.create(commentCreateRequest).then(value => value.toJSON());
            });

        // update the time fields each time a message is received
        if (ActionDirection.INCOMING === actionDirection) {
            // means processMessage was called from onEvent() and we should update the Comment data
            await this.commentService.updateTimes(comment.id, smsgMessage.sent, smsgMessage.received, smsgMessage.expiration)
                .then(value => value.toJSON());
            this.log.debug('processMessage(), comment times updated');
        } else {
            // when called from send(), the times do not need to be updated
        }

        return smsgMessage;
    }

    public async createNotification(
        marketplaceMessage: MarketplaceMessage,
        actionDirection: ActionDirection,
        smsgMessage: resources.SmsgMessage
    ): Promise<MarketplaceNotification | undefined> {

        // only send notifications when receiving messages
        if (ActionDirection.INCOMING === actionDirection) {

            // only notify if the Comment is not from you
            const comment: resources.Comment = await this.commentService.findOneByMsgId(smsgMessage.msgid)
                .then(value => value.toJSON());

            if (comment) {
                // TODO: this doesn't consider that there could be different Profiles!!!
                const isMyComment = await this.identityService.findOneByAddress(comment.sender)
                    .then(() => true)
                    .catch(() => false);

                // Dont need notifications about my own comments
                if (isMyComment) {
                    return undefined;
                }

                const notification: MarketplaceNotification = {
                    event: CommentAction.MPA_COMMENT_ADD,
                    payload: {
                        objectId: comment.id,
                        objectHash: comment.hash,
                        from: comment.sender,
                        to: comment.receiver,
                        target: comment.target,
                        category: comment.commentType,
                        parentObjectId: !_.isEmpty(comment.ParentComment) ? comment.ParentComment.id : undefined,
                        parentObjectHash: !_.isEmpty(comment.ParentComment) ? comment.ParentComment.hash : undefined
                    } as CommentAddNotification
                };

                return notification;
            }
        }
        return undefined;
    }

}
