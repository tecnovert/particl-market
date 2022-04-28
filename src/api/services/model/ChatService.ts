// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../../core/Logger';
import { ListingItemService } from './ListingItemService';
import { OrderService } from './OrderService';
import { Chat } from '../../models/Chat';
import { Types, Core, Targets } from '../../../constants';
import { ChatChannelType, ChannelListItem, ChannelMessage, ParticipantListItem } from '../../enums/Chat';




export enum CHAT_ERRORS {
}


export interface ChannelSearchParams {
    identityId: number;
    channelType?: ChatChannelType;
}

export interface ChannelMessageListParams {
    identityId: number;
    channel: string;
    channelType: ChatChannelType;
    count: number;
    fromMsg?: string;
    direction: 'ASC' | 'DESC';
}

export interface ChannelDeleteParams {
    channel: string;
    channelType: ChatChannelType.ORDER;
}


export class ChatService {

    private log: LoggerType;

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.model.ListingItemService) private listingItemService: ListingItemService,
        @inject(Types.Service) @named(Targets.Service.model.OrderService) private orderService: OrderService,
        @inject(Types.Model) @named(Targets.Model.Chat) private ChatModel: typeof Chat
    ) {
        this.log = new Logger(__filename);
    }


    public async listFollowedChannels(params: ChannelSearchParams, withDetails: boolean = false): Promise<ChannelListItem[]> {
        const channels = await this.ChatModel.listFollowedChannels(params.identityId, params.channelType);
        if (withDetails) {
            for (const channel of channels) {
                if (channel.channel_type === ChatChannelType.LISTINGITEM) {
                    const details = await this.listingItemService.findAllByHash(channel.channel)
                        .then(value => value.toJSON())
                        .then(items => items[0])
                        .catch(() => null);
                    if (details) {
                        channel.channelDetails = details;
                    }
                } else if (channel.channel_type === ChatChannelType.ORDER) {
                    const details = await this.orderService.findOneByHash(channel.channel)
                        .then(value => value.toJSON())
                        .catch(() => null);
                    if (details) {
                        channel.channelDetails = details;
                    }
                }
            }
        }
        return channels;
    }


    public async fetchChannelMessages(params: ChannelMessageListParams): Promise<ChannelMessage[]> {
        return await this.ChatModel.getChannelMessages(
            params.identityId,
            params.channel,
            params.channelType,
            params.count,
            params.direction,
            params.fromMsg
        );
    }


    public async setChannelReadFrom(identityId: number, channel: string, channelType: ChatChannelType, timestamp: number): Promise<boolean> {
        return await this.ChatModel.setChannelReadFrom(identityId, channel, channelType, timestamp);
    }


    // public async deleteChannel(params: ChannelDeleteParams): Promise<boolean> {
    //     return await this.ChatModel.deleteChannel(params.channel, params.channelType);
    // }


    public async followChannel(identityId: number, channel: string, channelType: ChatChannelType): Promise<boolean> {
        return await this.ChatModel.followChatChannel(identityId, channel, channelType);
    }


    public async unFollowChannel(identityId: number, channel: string, channelType: ChatChannelType): Promise<boolean> {
        return await this.ChatModel.unFollowChatChannel(identityId, channel, channelType);
    }


    public async listSavedParticipants(): Promise<ParticipantListItem[]> {
        return await this.ChatModel.listSavedParticipants();
    }


    public async updateParticipantLabel(address: string, label: string | null): Promise<boolean> {
        return await this.ChatModel.updateParticipantLabel(address, label);
    }


    public async cleanupParticipants(): Promise<void> {
        return await this.ChatModel.cleanupParticipants();
    }

    public async cleanupChatChannels(): Promise<void> {
        return await this.ChatModel.cleanupChatChannels();
    }

}
