// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { Bookshelf } from '../../config/Database';
import { ChatChannelType, ChannelListItem, ChannelMessage, ParticipantListItem } from '../enums/Chat';


export class Chat extends Bookshelf.Model<Chat> {

    /**
     * Creates a chat message for a particular channel, creating the channel if necessary and subscribing to the channel automatically if desired.
     *
     * @param smsgMsgId     The identifier for the chat message, specifically the incoming smsg msgid value.
     * @param channel       The channel (hash value) to which the message is being posted
     *                          (necessary so as to create the relevant chat channel if it does not previously exist).
     * @param channelType   The type of the channel, as defined by ChatChannelType.
     *                      Necessary in case different types generate the same hash in which case this serves to distinguish the specific channel posting to.
     * @param sender        The address being used to post the message from.
     * @param message       The contents of the message.
     * @param identityId    (Optional) providing this subscribes the identity to the chat channel.
     * @returns             true/false indicating whether saved successfully or not.
     */
    public static async insertChatMessage(
        smsgMsgId: string,
        channel: string,
        channelType: string,
        sender: string,
        message: string,
        createdAt: number,
        identityId: number = 0
    ): Promise<boolean> {
        try {
            await Bookshelf.knex.transaction(async trx => {

                /**
                 * There seems to be an issue with flushing inserts written in raw sql:
                 *     the transaction returns successfully, but the writes are never actually made.
                 * Thus, instead of the eloquent `INSERT OR IGNORE INTO ...` type of statements,
                 *     one is forced to using the shitty syntax below (with the .catch() statements to deal with contraint hits)
                 *
                 * Also, its unsupported (doesn't work) to run multiple queries in a raw SQL statement and having knex execute that with knex.raw(...).
                 * Which might be due to the outdated version of knex installed
                 * (for example, the docs reference insert( ).onConflict().ignore() which isn't available in the installed version)
                 *
                 * And bookshelfjs is absolute horseshit: why there is a need to wrap knex (why is this even being used??) with something worse is beyond me.
                 *
                 * Will now end my self-protest... but the next traveller to these dark corners: beware!
                 */
                const createdDate = Number.isSafeInteger(createdAt) && createdAt > 0 ? createdAt : Date.now();

                const channelObj = {
                    hash: channel,
                    hash_type: channelType
                };
                const participantObj = {
                    sender
                };
                await trx('chat_channels').insert(channelObj).catch(() => {
                    return null;
                });

                await trx('chat_participants').insert(participantObj).catch(() => {
                    return null;
                });

                const channel_id_sub = trx('chat_channels').select('id').where(channelObj).limit(1);
                const participant_id_sub = trx('chat_participants').select('id').where(participantObj).limit(1);

                await trx('chat_messages').insert({
                    msgid: smsgMsgId,
                    chat_channel_id: channel_id_sub,
                    chat_participant_id: participant_id_sub,
                    created_at: createdDate,
                    message
                });

                if (+identityId > 0) {
                    await trx('chat_follows').insert({
                        chat_channel_id: channel_id_sub,
                        identity_id: identityId
                    }).catch(() => {
                        // do nothing for now... will fail if the channel has already been followed
                        // definitely better ways to do this!
                    });
                }
            });

            return true;
        } catch (error) {
            return false;
        }
    }


    /**
     *  Obtain a list of channels that are watched/followed by a particular identity.
     *
     * @param identityId    The identity for which to retrieve followed channels.
     * @param channelType   (Optional) A filter to return only the specific type of channel (if provided) otherwise all followed channels.
     * @returns             A list of channels that the identity has followed.
     */
    public static async listFollowedChannels(identityId: number, channelType?: ChatChannelType): Promise<ChannelListItem[]> {
        const bindings = {
            identityId
        };

        let subfilter = '';

        if (channelType) {
            subfilter = 'AND  chat_channel.channel_type = :channelType';
            bindings['channelType'] = channelType;
        }

        const query = `
            SELECT 	chat_channels.hash AS channel
                    , chat_channels.hash_type AS channel_type
                    , COALESCE(msg_details.latest_received, 0) > followed_channels.last_read AS has_unread
                    , msg_details.participant_count AS participant_count
                    , msg_details.latest_received AS newest_message
                    , followed_channels.last_read AS last_read

            FROM	(
                        SELECT 	chat_channel_id AS channel_id
                                , last_read
                        FROM	chat_follows
                        WHERE	chat_follows.identity_id = :identityId
                    ) followed_channels

                    INNER JOIN 	chat_channels
                    ON			chat_channels.id = followed_channels.channel_id
                    ${subfilter}

                    INNER JOIN (
                        SELECT 	chat_messages.chat_channel_id AS id
                                , MAX(created_at) AS latest_received
                                , COUNT(DISTINCT chat_participant_id) AS participant_count
                        FROM	chat_messages
                        WHERE	chat_messages.chat_channel_id IN (
                                    SELECT 	DISTINCT(chat_channel_id) AS channel_id
                                    FROM	chat_follows
                                    WHERE	chat_follows.identity_id = :identityId
                                )
                        GROUP BY chat_channel_id
                    ) msg_details
                    ON chat_channels.id = msg_details.id
        `;

        return await Bookshelf.knex.raw(query, bindings);
    }


    public static async listIdentitesFollowingChannel(channel: string): Promise<number[]> {

        const query = `
            SELECT	DISTINCT(chat_follows.identity_id) AS id
            FROM	chat_follows
            WHERE	chat_follows.chat_channel_id IN (
                        SELECT id FROM chat_channels WHERE chat_channels.hash = :channel
                    )
        `;
        const bindings = {
            channel
        };

        const ids = await Bookshelf.knex.raw(query, bindings).then(results => results.map(r => r.id)).catch(() => []);

        return ids;
    }


    /**
     * Retrieves a list of messages for a specific channel and matching a set of search criteria.
     *
     * @param identityId    The identity viewing the messages (used to determine whether a message was from this identity or not).
     * @param channel       The channel being requested (the hash of the item identified by `ChatChannelType`).
     * @param channelType   A value corresponding to ChatChannelType useful in case multiple hashes from different types match.
     * @param count         The number of messages to retrieve.
     * @param sort          Indicates whether the messages should be returned from earliest to latest ('ASC') or latest to earliest ('DESC').
     * @param fromMsg       Optional; message msgid value from which to return results from (useful for pagination).
     * @returns             A list of messages matching the serach criteria; ChannelMessage[] .
     */
    public static async getChannelMessages(
        identityId: number,
        channel: string,
        channelType: ChatChannelType,
        count: number = 20,
        sort: 'ASC' | 'DESC' = 'DESC',
        fromMsg?: string
    ): Promise<ChannelMessage[]> {
        const bindings = {
            identityId,
            channel,
            channelType,
            count
        };

        let offsetSql = '';
        if ((typeof fromMsg === 'string') && fromMsg) {
            bindings['fromMsg'] = fromMsg;
            offsetSql = `AND chat_messages.id ${sort === 'ASC' ? '>' : '<'} ( SELECT id FROM chat_messages WHERE msgid = :fromMsg LIMIT 1 )`;
        }

        const dirSql = sort === 'ASC' ? 'ASC' : 'DESC';

        const query = `
            SELECT 	chat_messages.msgid
                    , chat_messages.message
                    , chat_messages.created_at
                    , COALESCE(chat_participants.sender, '') AS sender_address
                    , COALESCE(chat_participants.label, '') AS sender_label
                    , COALESCE(chat_follows.last_read, 0) >= chat_messages.created_at AS is_read
                    , COALESCE(chat_participants.sender, '') = id_address.address AS is_own

            FROM	chat_channels

                    INNER JOIN chat_messages ON chat_channels.id = chat_messages.chat_channel_id

                    LEFT JOIN chat_participants ON chat_messages.chat_participant_id = chat_participants.id

                    LEFT JOIN (SELECT id, address FROM identities WHERE identities.id = :identityId LIMIT 1) id_address ON 1=1

                    LEFT JOIN chat_follows ON chat_follows.chat_channel_id = chat_channels.id AND chat_follows.identity_id = id_address.id

            WHERE	chat_channels.hash = :channel
            AND		chat_channels.hash_type = :channelType
            ${offsetSql}
            ORDER BY chat_messages.id ${dirSql}
            LIMIT :count
        `;

        return await Bookshelf.knex.raw(query, bindings).then(results => {
            let retVal: ChannelMessage[] = [];
            if (Array.isArray(results)) {
                retVal = results.map(r => ({...r, is_read: !!r.is_read, is_own: !!r.is_own}));
            }
            return retVal;
        });
    }


    public static async setChannelReadFrom(identityId: number, channel: string, channelType: ChatChannelType, timestamp: number): Promise<boolean> {

        const channel_query = Bookshelf.knex('chat_channels').select('id').where({
            hash: channel,
            hash_type: channelType
        });

        const success = await Bookshelf.knex('chat_follows')
            .where({
                identity_id: identityId,
                chat_channel_id: channel_query
            })
            .andWhere('last_read', '<', timestamp)
            .update({last_read: timestamp})
            .then(() => true)
            .catch(() => false);

        return success;
    }


    /**
     * Indicates whether the chat message with the given id exists.
     *
     * @param msgid     The smsg msgid identifying the chat message.
     * @returns         true | false indicating whether a chat message with the given id exists or not.
     */
    public static async messageExists(msgid: string): Promise<boolean> {
        const hasItems = await Bookshelf.knex('chat_messages').select('msgid').where({msgid})
            .catch(err => [])
            .then(resp => Array.isArray(resp) && (resp.length > 0));
        return hasItems;
    }


    public static async followListingChannelForSeller(channel: string): Promise<void> {
        try {
            await Bookshelf.knex.transaction(async trx => {
                const identityListQuery = `
                    SELECT 	DISTINCT(markets.identity_id)
                    FROM	markets
                            INNER JOIN  listing_item_templates
                            ON			markets.receive_address = listing_item_templates.market
                            INNER JOIN 	listing_items
                            ON 			listing_item_templates.id = listing_items.listing_item_template_id
                            AND 		listing_items.hash = :channel
                `;
                const identities: number[] = await trx.raw(identityListQuery, { channel }).then(results => {
                    return results.map(r => r.identity_id);
                }).catch(() => []);

                const channelID = await trx('chat_channels').select('id').where({
                    hash: channel,
                    hash_type: ChatChannelType.LISTINGITEM
                })
                .catch(() => [])
                .then(channelids => {
                    if (Array.isArray(channelids)) {
                        return +channelids.map(c => +c.id).filter(id => +id > 0)[0];
                    }
                    return 0;
                });

                if (+channelID > 0) {

                    for (const identityId of identities) {
                        await trx('chat_follows').insert({
                            chat_channel_id: channelID,
                            identity_id: identityId
                        }).then(() => true).catch(() => false);
                    }
                }
            });
        } catch (err) {
            // nothing to do
        }
    }


    public static async followOrderChannel(channel: string): Promise<void> {
        try {
            await Bookshelf.knex.transaction(async trx => {
                const identityListQuery = `
                SELECT	DISTINCT(identities.id)
                FROM	identities
                        INNER JOIN (
                                        SELECT 	buyer
                                                , seller
                                        FROM	orders
                                        WHERE	orders.hash = :channel
                                    ) order_addresses
                        ON	        identities.address = order_addresses.buyer OR identities.address = order_addresses.seller
                `;
                const identities: number[] = await trx.raw(identityListQuery, {channel}).then(results => {
                    return results.map(r => r.id);
                }).catch(() => []);

                const channelID = await trx('chat_channels').select('id').where({
                    hash: channel,
                    hash_type: ChatChannelType.ORDER
                })
                .catch(() => [])
                .then(channelids => {
                    if (Array.isArray(channelids)) {
                        return +channelids.map(c => +c.id).filter(id => +id > 0)[0];
                    }
                    return 0;
                });

                if (+channelID > 0) {
                    for (const identityId of identities) {
                        await trx('chat_follows').insert({
                            chat_channel_id: channelID,
                            identity_id: identityId
                        }).then(() => true).catch(() => false);
                    }
                }
            });
        } catch (err) {
            // nothing to do
        }
    }


    /**
     * Allows the identity to "subscribe" to specific chat channels, which the identity can view at a later point.
     *
     * @param identityId    id of the identity that wishes to follow a specific channel.
     * @param channel       The channel (hash of the item) to be followed.
     * @param channelType   The ChatChannelType of the channel to be followed.
     * @returns             true | false indicating whether the channel was successfully followed.
     *                          If the channel was previously followed then true is returned.
     */
    public static async followChatChannel(identityId: number, channel: string, channelType: ChatChannelType): Promise<boolean> {

        let success = false;
        try {
            await Bookshelf.knex.transaction(async trx => {
                const channelIDs = await trx('chat_channels').select('id').where({
                    hash: channel,
                    hash_type: channelType
                });

                if (Array.isArray(channelIDs) && (channelIDs.length > 0) && (+channelIDs[0].id > 0)) {
                    const isFollowing = await trx('chat_follows')
                        .where('chat_channel_id', +channelIDs[0].id)
                        .andWhere('identity_id', identityId)
                        .then(res => !!res);

                    if (!isFollowing) {
                        await trx('chat_follows').insert({
                            chat_channel_id: +channelIDs[0].id,
                            identity_id: identityId
                        });
                    }
                }
            });
            success = true;
        } catch (err) {
            // nothing to do
        }
        return success;
    }


    /**
     *
     * @param identityId    id of the identity that wishes to no longer follow a specific channels messages.
     * @param channel       The channel (hash of the item) to be unfollowed.
     * @param channelType   The ChatChannelType of the channel to be unfollowed.
     * @returns             true | false indicating whether the channel was successfully unfollowed.
     */
    public static async unFollowChatChannel(identityId: number, channel: string, channelType: ChatChannelType): Promise<boolean> {
        const channelObj = {
            hash: channel,
            hash_type: channelType
        };

        let success = false;

        try {
            const channelIDs: Array<{id: number}> = await Bookshelf.knex
                .select('id')
                .from('chat_channels')
                .where(channelObj);

            if (Array.isArray(channelIDs) && (channelIDs.length > 0) && (+channelIDs[0].id > 0)) {
                await Bookshelf.knex('chat_follows').where('chat_channel_id', +channelIDs[0].id).andWhere('identity_id', identityId).del();
            }

            success = true;
        } catch (err) {
            // nothing to do currently
        }
        return success;
    }


    public static async listSavedParticipants(): Promise<ParticipantListItem[]> {
        const query = `
            SELECT  sender AS address
                    , label
            FROM    chat_participants
            WHERE   label IS NOT NULL
        `;

        return await Bookshelf.knex.raw(query);
    }


    public static async updateParticipantLabel(address: string, label: string | null): Promise<boolean> {

        return await Bookshelf.knex('chat_participants')
            .where({
                sender: address
            })
            .update({ label: label && label.length > 0 ? label : null })
            .then(() => true)
            .catch(() => false);
    }


    public static async cleanupParticipants(): Promise<void> {
        await Bookshelf.knex('chat_participants')
            .whereRaw('id NOT IN (SELECT chat_participant_id FROM chat_messages GROUP BY chat_participant_id) AND label IS NULL')
            .del()
            .catch(err => {
                // do something here ?
            });
    }


    public static async cleanupChatChannels(): Promise<void> {
        const unusedChannels = `
            SELECT  id
            FROM    (
                SELECT	id
                FROM	chat_channels
                WHERE	hash_type = '${ChatChannelType.LISTINGITEM}'
                AND		hash NOT IN (SELECT hash from listing_items)
                UNION
                SELECT 	id
                FROM	chat_channels
                WHERE	hash_type = '${ChatChannelType.ORDER}'
                AND		hash NOT IN (SELECT hash from orders)
            ) channel_id_list
            WHERE id NOT IN (SELECT chat_channel_id FROM chat_follows)
        `;
        await Bookshelf.knex('chat_channels').whereRaw(`id IN (${unusedChannels})`).del().catch(() => null);
    }
}
