// Copyright (c) 2017-2022, The Particl Market developers
// Copyright (c) 2017-2022, The Particl Market developers
// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as resources from 'resources';
import { inject, named } from 'inversify';
import { ompVersion } from '@zasmilingidiot/omp-lib/dist/omp';
import { strip } from '@zasmilingidiot/omp-lib/dist/util';
import { ConfigurableHasher } from '@zasmilingidiot/omp-lib/dist/hasher/hash';
import { Logger as LoggerType } from '../../../core/Logger';
import { Core, Targets, Types } from '../../../constants';
import { SmsgService } from '../SmsgService';
import { CoreRpcService } from '../CoreRpcService';
import { VerifiableMessage } from '../../factories/message/ListingItemAddMessageFactory';
import { HashableChatAddMessageConfig } from '../../factories/hashableconfig/message/HashableChatAddMessageConfig';
import { EnumHelper } from '../../../core/helpers/EnumHelper';
import { ListingItemService } from '../model/ListingItemService';
// import { MarketService } from '../model/MarketService';
// import { IdentityService } from '../model/IdentityService';
import { NotifyService } from '../NotifyService';
import { OrderService } from '../model/OrderService';
import { CoreMessageVersion } from '../../enums/CoreMessageVersion';
import { CommentAction } from '../../enums/CommentAction';
import { ChatChannelType } from '../../enums/Chat';
import { ActionMessageInterface } from '../../messages/action/ActionMessageInterface';
import { MarketplaceMessage } from '../../messages/MarketplaceMessage';
import { MarketplaceMessageEvent } from '../../messages/MarketplaceMessageEvent';
import { MessageVersions } from '../../messages/MessageVersions';
import { SmsgSendParams } from '../../requests/action/SmsgSendParams';
import { Chat } from '../../models/Chat';
import { MarketplaceNotification } from '../../messages/MarketplaceNotification';



export enum ADD_ACTION_ERRORS {
    SIGNING_ERROR = 'CHAT_SIGN_ERROR',
    SIZE_ERROR = 'MESSAGE_SIZE_ERROR',
    SMSG_SEND_FAILED = 'SMSG_SENDING_FAILED'
}


interface ChatMessagSendeData extends ActionMessageInterface {
    type: CommentAction.MPA_CHAT_MESSAGE_ADD;
    sender: string;
    receiver: string;
    message: string;
    signature: string;
    channel: string;
    channelType: string;
}

export interface SendChatParams {
    senderAddress: string;
    wallet: string;
    recipient: string;
    message: string;
    channel: string;
    channelType: ChatChannelType;
    identityId?: number;
}

interface SignableChatMessage extends VerifiableMessage {
    sender: string;
    channel: string;
    channelType: string;
    message: string;
}

interface NotificationMessage extends MarketplaceNotification {
    payload: {
        from: string;
        to: string;
        channel: string;
        channelType: ChatChannelType;
        created: number;
        identities: number[];
        // exists simply for extending the interface
        objectId: number;
        objectHash: string;
    };
}


export class ChatAddActionService {

    public log: LoggerType;

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.SmsgService) private smsgService: SmsgService,
        @inject(Types.Service) @named(Targets.Service.CoreRpcService) private coreRpcService: CoreRpcService,
        @inject(Types.Service) @named(Targets.Service.model.ListingItemService) private listingItemService: ListingItemService,
        @inject(Types.Service) @named(Targets.Service.model.OrderService) private orderService: OrderService,
        // @inject(Types.Service) @named(Targets.Service.model.MarketService) private marketService: MarketService,
        // @inject(Types.Service) @named(Targets.Service.model.IdentityService) private identityService: IdentityService,
        @inject(Types.Service) @named(Targets.Service.NotifyService) private notifyService: NotifyService,
        @inject(Types.Model) @named(Targets.Model.Chat) private ChatModel: typeof Chat
    ) {
        this.log = new Logger(__filename);
    }


    public async sendMessage(actionRequest: SendChatParams, messageType: CoreMessageVersion = CoreMessageVersion.FREE): Promise<string | null> {
        // sign message
        const signableParams: SignableChatMessage = {
            sender: actionRequest.senderAddress,
            channel: actionRequest.channel,
            channelType: actionRequest.channelType,
            message: actionRequest.message
        };

        const signature = await this.coreRpcService.signMessage(actionRequest.wallet, actionRequest.senderAddress, signableParams).catch(err => {
            this.log.error('Chat send signing error:', err);
            throw new Error(ADD_ACTION_ERRORS.SIGNING_ERROR);
        });

        // create MarketPlaceMessage for sending
        const message: Omit<ChatMessagSendeData, 'hash' | 'objects'> = {
            type: CommentAction.MPA_CHAT_MESSAGE_ADD,
            channel: actionRequest.channel,
            channelType: actionRequest.channelType,
            sender: actionRequest.senderAddress,
            receiver: actionRequest.recipient,
            message: actionRequest.message,
            generated: +Date.now(),
            signature
        };

        const messageHash = this.getMessageHash(message);
        const actualMessage: ChatMessagSendeData = {...message, hash: messageHash, objects: undefined};

        let mpMessage: MarketplaceMessage = {
            version: ompVersion(),
            action: actualMessage
        };

        mpMessage = strip(mpMessage);

        if (!this.messageSizeFits(mpMessage, messageType)) {
            this.log.error('chat message sending exceeds size');
            throw new Error(ADD_ACTION_ERRORS.SIZE_ERROR);
        }

        const isPaid = messageType === CoreMessageVersion.PAID;

        // actually send the message and handle the sending result
        const sendParams: SmsgSendParams = {
            wallet: actionRequest.wallet,
            fromAddress: actionRequest.senderAddress,
            toAddress: actionRequest.recipient,
            daysRetention: parseInt(
                isPaid ? process.env.PAID_MESSAGE_RETENTION_DAYS : process.env.FREE_MESSAGE_RETENTION_DAYS,
                10
            ) || 0,
            estimateFee: false,
            anonFee: false,
            messageType
        };

        const smsgSendResponse = await this.smsgService.sendMessage(mpMessage, sendParams).catch(err => {
            this.log.error('SMSG sending failed: ', err);
            return null;
        });

        if (
            (Object.prototype.toString.call(smsgSendResponse) !== '[object Object]') ||
            !smsgSendResponse ||
            (typeof smsgSendResponse.result !== 'string') ||
            (smsgSendResponse.result.toLowerCase() !== 'sent.')
        ) {
            this.log.error('SMSG send error, response = ', smsgSendResponse);
            throw new Error(ADD_ACTION_ERRORS.SMSG_SEND_FAILED);
        }

        // insert message into database
        await this.ChatModel.insertChatMessage(
            smsgSendResponse.msgid || '',
            actionRequest.channel,
            actionRequest.channelType,
            actionRequest.senderAddress,
            actionRequest.message,
            Date.now(),
            actionRequest.identityId
        );

        return smsgSendResponse.msgid || '';

    }


    public async receiveMessage(data: MarketplaceMessageEvent): Promise<boolean> {

        // Validate that the correct data is present and correct
        const incomingMarketMsg: any =
            this.isValidType(data, 'object', true) &&
            this.isValidType(data.marketplaceMessage, 'object', true) &&
            this.isValidType(data.marketplaceMessage.action, 'object', true)
            ? data.marketplaceMessage.action : {};

        const incomingSmsg: any =
            this.isValidType(data, 'object', true) &&
            this.isValidType(data.smsgMessage, 'object', true)
            ? data.smsgMessage : {};

        const invalidMarketFields = [
            {field: 'channel', valueType: 'string'},
            {field: 'channelType', valueType: 'string'},
            {field: 'sender', valueType: 'string'},
            {field: 'message', valueType: 'string'},
            {field: 'signature', valueType: 'string'},
            {field: 'generated', valueType: 'number'},
            {field: 'hash', valueType: 'string'}
        ].filter(f => !this.isValidType(incomingMarketMsg[f.field], f.valueType as any, true));

        const invalidSmsgFields = [
            {field: 'from', valueType: 'string'},
            {field: 'to', valueType: 'string'},
            {field: 'msgid', valueType: 'string'},
            {field: 'createdAt', valueType: 'number'}
        ].filter(f => !this.isValidType(incomingSmsg[f.field], f.valueType as any, true));

        if ((invalidMarketFields.length > 0) || (invalidSmsgFields.length > 0)) {
            this.log.warn('invalid fields found in received message');
            return false;
        }

        const msgExists = await this.ChatModel.messageExists(incomingSmsg.msgid);
        if (msgExists) {
            this.log.warn('incoming message already exists');
            return false;
        }

        if (!EnumHelper.containsName(ChatChannelType, incomingMarketMsg.channelType)) {
            this.log.warn('unsupported channel type in received message');
            return false;
        }

        const signableContent: SignableChatMessage = {
            channelType: incomingMarketMsg.channelType,
            channel: incomingMarketMsg.channel,
            message: incomingMarketMsg.message,
            sender: incomingMarketMsg.sender
        };
        const isValidSignature = await this.coreRpcService.verifyMessage(
            incomingSmsg.from,
            incomingMarketMsg.signature,
            signableContent
        );
        if (!isValidSignature) {
            this.log.warn('invalid signature found in received message');
            return false;
        }

        const message: Omit<ChatMessagSendeData, 'hash' | 'objects'> = {
            type: CommentAction.MPA_CHAT_MESSAGE_ADD,
            channelType: incomingMarketMsg.channelType,
            channel: incomingMarketMsg.channel,
            message: incomingMarketMsg.message,
            sender: incomingMarketMsg.sender,
            receiver: incomingSmsg.to,
            generated: incomingMarketMsg.generated,
            signature: incomingMarketMsg.signature
        };
        const messageHash = this.getMessageHash(message);
        if (messageHash !== incomingMarketMsg.hash) {
            this.log.warn('invalid signature found in received message');
            return false;
        }

        const now = Date.now();

        const createdDate = this.isValidType(data, 'object', true)
            && this.isValidType(data.smsgMessage, 'object', true)
            && Number.isSafeInteger(+data.smsgMessage.sent)
            && +data.smsgMessage.sent < now
            // next line can lead to possible issues - should be validated properly to prevent "read" messages being inserted automatically
            //  But against what to validate is the question.
            && +data.smsgMessage.sent > 0
            ? +data.smsgMessage.sent : now;

        // insert incoming chat into database
        const insertSuccess = await this.ChatModel.insertChatMessage(
            incomingSmsg.msgid,
            incomingMarketMsg.channel,
            incomingMarketMsg.channelType,
            incomingMarketMsg.sender,
            incomingMarketMsg.message,
            createdDate
        );

        if (!insertSuccess) {
            this.log.warn('writing received chat message to db failed');
        } else {
            // send notification if saved successfully

            if (incomingMarketMsg.channelType === ChatChannelType.LISTINGITEM) {
                await this.ChatModel.followListingChannelForSeller(incomingMarketMsg.channel);
                // const listingMarkets: string[] = await this.listingItemService.findAllByHash(incomingMarketMsg.channel)
                //     .then(value => value.toJSON())
                //     .then(items => items.map(i => i.market))
                //     .catch(() => []);

                // if (listingMarkets.length > 0) {
                //     const lookupMarket = listingMarkets[0];
                //     const ids = await this.marketService.findAllByReceiveAddress(lookupMarket)
                //         .then(value => value.toJSON())
                //         .catch(err => [])
                //         .then((allMarkets: resources.Market[]) => allMarkets
                //             .map(m =>
                //                 m &&
                //                 m.Identity &&
                //                 (+m.Identity.id > 0) ?
                //                 +m.Identity.id : 0
                //             )
                //             .filter(id => +id > 0)
                //         );
                //     forIdentities.push(...ids);
                // }

            } else if (incomingMarketMsg.channelType === ChatChannelType.ORDER) {
                await this.ChatModel.followOrderChannel(incomingMarketMsg.channel);
                // const orderAddresses = await this.orderService.findOneByHash(incomingMarketMsg.channel)
                //     .then(value => value.toJSON())
                //     .then(order => {
                //         const addresses: string[] = [];
                //         if (order) {
                //             if (typeof order.seller === 'string') {
                //                 addresses.push(order.seller);
                //             }
                //             if (typeof order.buyer === 'string') {
                //                 addresses.push(order.buyer);
                //             }
                //         }
                //         return addresses;
                //     })
                //     .catch(er => []);

                // if (orderAddresses.length > 0) {
                //     const ids = await this.identityService.findAll()
                //         .then(value => value.toJSON())
                //         .catch(() => [])
                //         .then((allIds: resources.Identity[]) => allIds
                //             .filter(id =>
                //                 id &&
                //                 (typeof id.address === 'string') &&
                //                 (orderAddresses.findIndex(oa => oa === id.address) > -1))
                //             .map(id => id.id)
                //         );
                //     forIdentities.push(...ids);
                // }
            }

            // Extract the identities the notification applies to
            const forIdentities: number[] = await this.ChatModel.listIdentitesFollowingChannel(incomingMarketMsg.channel);


            if (forIdentities.length > 0) {
                const notifyMsg: NotificationMessage = {
                    event: CommentAction.MPA_CHAT_MESSAGE_ADD,
                    payload: {
                        from: incomingMarketMsg.sender,
                        to: incomingSmsg.to,
                        channel: incomingMarketMsg.channel,
                        channelType: incomingMarketMsg.channelType,
                        created: createdDate,
                        objectHash: '',
                        objectId: 0,
                        identities: forIdentities
                    }
                };
                await this.notifyService.send(notifyMsg).catch(err => null);
            }
        }

        return insertSuccess;

    }


    public async getMessageChannelRecipient(
        identity: resources.Identity, channel: string, channelType: ChatChannelType
    ): Promise<string> {
        let recipientAddress: string | undefined;


        switch (channelType) {
            case ChatChannelType.LISTINGITEM:
                recipientAddress = await this.listingItemService.findAllByHash(channel)
                    .then(value => value.toJSON())
                    .then((listings: resources.ListingItem[]) => {
                        const foundListing = listings.find(l => identity.Markets.findIndex(m => m.receiveAddress === l.market) > -1 );
                        if (foundListing) {
                            return foundListing.market;
                        }
                        return undefined;
                    }).catch(() => {
                        return undefined;
                    });
                break;

            case ChatChannelType.ORDER:
                recipientAddress = await this.orderService.findOneByHash(channel)
                    .then(value => value.toJSON())
                    .then((order: resources.Order) => {
                        channelType = ChatChannelType.ORDER;

                        if (order) {
                            const sellerAddress = (typeof order.seller === 'string') && (order.seller.length > 0) ? order.seller : '';
                            const buyerAddress = (typeof order.buyer === 'string') && (order.buyer.length > 0) ? order.buyer : '';

                            if (sellerAddress.length > 0 && buyerAddress.length > 0) {
                                return sellerAddress === identity.address ?
                                    buyerAddress :
                                    (buyerAddress === identity.address ? sellerAddress : undefined);
                            }
                        }

                        return undefined;
                    })
                    .catch(() => undefined);
                break;

            default:
                recipientAddress = undefined;
        }

        return recipientAddress || '';
    }


    private messageSizeFits(marketplaceMessage: MarketplaceMessage, messageType: CoreMessageVersion): boolean {
        if (!messageType) {
            return false;
        }
        const maxSize = MessageVersions.maxSize(messageType);

        const messageSize = JSON.stringify(marketplaceMessage).length;
        const spaceLeft = maxSize - messageSize;
        return  spaceLeft > 0;
    }


    private getMessageHash(message: Omit<ChatMessagSendeData, 'hash' | 'objects'>): string {
        return ConfigurableHasher.hash(message, new HashableChatAddMessageConfig());
    }


    private isValidType(value: any, type: 'string' | 'number' | 'boolean' | 'object', hasValue: boolean = false): boolean {
        const tm = typeof value === type;
        if (!tm || !hasValue) {
            return tm;
        }
        switch (type) {
            case 'string':
                return (value as string).length > 0;
            case 'object':
                return (Object.prototype.toString.call(value) === '[object Object]') && !!value;
            case 'number':
                return !Number.isNaN(+(value as number)) && Number.isFinite(value);
            default:
                return true;
        }
    }
}
