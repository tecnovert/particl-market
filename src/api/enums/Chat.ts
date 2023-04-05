// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE



export enum ChatChannelType {
    LISTINGITEM = 'LISTINGITEM',
    ORDER = 'ORDER'
}


export interface ChannelListItem {
    channel: string;
    channel_type: string;
    has_unread: boolean;
    participant_count: number;
    newest_message: number;
    last_read: number;
    channelDetails?: any;
}


export interface ParticipantListItem {
    address: string;
    label: string;
}


export interface BasicMessage {
    msgid: string;
    message: string;
    created_at: number;
    sender_address: string;
    sender_label: string;
}


export interface ChannelMessage extends BasicMessage {
    is_read: boolean;
    is_own: boolean;
}
