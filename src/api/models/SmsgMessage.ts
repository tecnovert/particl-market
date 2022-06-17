// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import { Bookshelf as Database, Bookshelf } from '../../config/Database';
import { Collection, Model } from 'bookshelf';
import { Logger as LoggerType } from '../../core/Logger';
import { ActionDirection } from '../enums/ActionDirection';
import { SmsgMessageCreateRequest } from '../requests/model/SmsgMessageCreateRequest';
import { SearchOrder } from '../enums/SearchOrder';
import { SmsgMessageSearchOrderField } from '../enums/SearchOrderField';
import { SmsgMessageSearchParams } from '../requests/search/SmsgMessageSearchParams';
import { ActionMessageTypes } from '../enums/ActionMessageTypes';

export class SmsgMessage extends Bookshelf.Model<SmsgMessage> {

    public static log: LoggerType = new LoggerType(__filename);

    public static RELATIONS = [];

    public static async createAll(datas: SmsgMessageCreateRequest[]): Promise<string[]> {
        await Database.knex
            .insert(datas, 'id')
            .into('smsg_messages');

        return datas.map(msg => msg.msgid);
    }

    public static async searchBy(options: SmsgMessageSearchParams, withRelated: boolean = false): Promise<Collection<SmsgMessage>> {

        options.page = options.page || 0;
        options.pageLimit = options.pageLimit || 10;
        options.order = options.order || SearchOrder.ASC.toString();
        options.orderField = options.orderField || SmsgMessageSearchOrderField.SENT.toString();

        if (!options.age) {
            options.age = 0;
        }

        const age = Date.now() - options.age;

        // SmsgMessage.log.debug('age: ', age);
        // SmsgMessage.log.debug('age.toString(): ', new Date(age).toString());
        // SmsgMessage.log.debug('...searchBy by options: ', JSON.stringify(options, null, 2));

        const messageCollection = SmsgMessage.forge<Model<SmsgMessage>>()
            .query(qb => {

                if (!_.isEmpty(options.msgid)) {
                    qb.andWhere('smsg_messages.msgid', '=', options.msgid);
                }

                if (!_.isEmpty(options.status)) {
                    qb.andWhere('smsg_messages.status', '=', options.status.toString());
                }

                if (!_.isEmpty(options.direction)) {
                    qb.andWhere('smsg_messages.direction', '=', options.direction.toString());
                }

                if (!_.isEmpty(options.types)) {
                    qb.whereIn('smsg_messages.type', options.types as ActionMessageTypes[]);
                }

                /*
                                if (options.listingItemId) {
                                    qb.andWhere( qbInner => {
                                        return qbInner.where('listing_items.id', '=', options.listingItemId);
                                    });
                                }
                */

                qb.where('smsg_messages.created_at', '<=', new Date(age).toString());

            })
            .orderBy('smsg_messages.' + options.orderField, options.order)
            .query({
                limit: options.pageLimit,
                offset: options.page * options.pageLimit,
                debug: false
            });

        return messageCollection.fetchAll(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }


    public static async cleanupByType(msgType: ActionMessageTypes): Promise<void> {
        await Bookshelf.knex('smsg_messages').where({type: msgType}).andWhere('expiration', '<', Date.now()).del().catch(() => null);
    }

    public static async fetchLast(): Promise<SmsgMessage> {
        const options = {
            page: 0,
            pageLimit: 1,
            order: SearchOrder.DESC.toString(),
            orderField: SmsgMessageSearchOrderField.ID.toString(),
            direction: ActionDirection.INCOMING
        } as SmsgMessageSearchParams;

        const messageCollection = SmsgMessage.forge<Model<SmsgMessage>>()
            .query(qb => {
                qb.where('smsg_messages.direction', '=', options.direction.toString());
            })
            .orderBy('smsg_messages.' + options.orderField, options.order)
            .query({
                limit: options.pageLimit,
                offset: options.page * options.pageLimit
            });
        const allMessages = await messageCollection.fetchAll({
            withRelated: this.RELATIONS
        });
        // this.log.debug('fetchLast(), allMessages:', JSON.stringify(allMessages, null, 2));
        return allMessages.first();
    }

    public static async fetchById(value: number, withRelated: boolean = true): Promise<SmsgMessage> {
        return SmsgMessage.where<SmsgMessage>({ id: value }).fetch(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public static async fetchByMsgIdAndDirection(
        value: string,
        direction: ActionDirection = ActionDirection.INCOMING,
        withRelated: boolean = true
    ): Promise<SmsgMessage> {
        return SmsgMessage.where<SmsgMessage>({ msgid: value, direction }).fetch(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public get tableName(): string { return 'smsg_messages'; }
    public get hasTimestamps(): boolean { return true; }

    public get Id(): number { return this.get('id'); }
    public set Id(value: number) { this.set('id', value); }

    public get Type(): string { return this.get('type'); }
    public set Type(value: string) { this.set('type', value); }

    public get Status(): string { return this.get('status'); }
    public set Status(value: string) { this.set('status', value); }

    public get Direction(): string { return this.get('direction'); }
    public set Direction(value: string) { this.set('direction', value); }

    public get Target(): string { return this.get('target'); }
    public set Target(value: string) { this.set('target', value); }

    public get Msgid(): string { return this.get('msgid'); }
    public set Msgid(value: string) { this.set('msgid', value); }

    public get Version(): string { return this.get('version'); }
    public set Version(value: string) { this.set('version', value); }

    public get Read(): boolean { return this.get('read'); }
    public set Read(value: boolean) { this.set('read', value); }

    public get Paid(): boolean { return this.get('paid'); }
    public set Paid(value: boolean) { this.set('paid', value); }

    public get Payloadsize(): number { return this.get('payloadsize'); }
    public set Payloadsize(value: number) { this.set('payloadsize', value); }

    public get Received(): number { return this.get('received'); }
    public set Received(value: number) { this.set('received', value); }

    public get Sent(): number { return this.get('sent'); }
    public set Sent(value: number) { this.set('sent', value); }

    public get Expiration(): number { return this.get('expiration'); }
    public set Expiration(value: number) { this.set('expiration', value); }

    public get Daysretention(): number { return this.get('daysretention'); }
    public set Daysretention(value: number) { this.set('daysretention', value); }

    public get From(): string { return this.get('from'); }
    public set From(value: string) { this.set('from', value); }

    public get To(): string { return this.get('to'); }
    public set To(value: string) { this.set('to', value); }

    public get Text(): string { return this.get('text'); }
    public set Text(value: string) { this.set('text', value); }

    public get ProcessedCount(): number { return this.get('processedCount'); }
    public set ProcessedCount(value: number) { this.set('processedCount', value); }

    public get ProcessedAt(): number { return this.get('processedAt'); }
    public set ProcessedAt(value: number) { this.set('processedAt', value); }

    public get UpdatedAt(): Date { return this.get('updatedAt'); }
    public set UpdatedAt(value: Date) { this.set('updatedAt', value); }

    public get CreatedAt(): Date { return this.get('createdAt'); }
    public set CreatedAt(value: Date) { this.set('createdAt', value); }

}
