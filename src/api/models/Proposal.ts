// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import { Bookshelf } from '../../config/Database';
import { Collection, Model } from 'bookshelf';
import { ProposalOption } from './ProposalOption';
import { ProposalResult } from './ProposalResult';
import { ProposalSearchParams } from '../requests/search/ProposalSearchParams';
import { FlaggedItem } from './FlaggedItem';
import { Logger as LoggerType } from '../../core/Logger';


export class Proposal extends Bookshelf.Model<Proposal> {

    public static log: LoggerType = new LoggerType(__filename);

    public static RELATIONS = [
        'ProposalOptions',
        // 'ProposalOptions.Votes',
        'ProposalResults',
        'ProposalResults.ProposalOptionResults',
        'ProposalResults.ProposalOptionResults.ProposalOption',
        'FlaggedItems',
        'FlaggedItems.ListingItem',
        'FlaggedItems.Market',
        'FinalProposalResult'
    ];

    /**
     * list * 100 -> return all proposals which ended before 100
     * list 100 * -> return all proposals ending after 100
     * list 100 200 -> return all which are active and closed between 100 200
     *
     * @param {ProposalSearchParams} options
     * @param {boolean} withRelated
     * @returns {Promise<Bookshelf.Collection<Proposal>>}
     */
    public static async searchBy(options: ProposalSearchParams, withRelated: boolean = false): Promise<Collection<Proposal>> {

        // this.log.debug('options: ', JSON.stringify(options, null, 2));

        const collection = Proposal.forge<Model<Proposal>>()
            .query(qb => {

                if (options.category) {
                    qb.where('proposals.category', '=', options.category.toString());
                }

                if (options.market) {
                    qb.where('proposals.market', '=', options.market);
                }

                if (typeof options.timeStart === 'number' && _.isNil(options.timeEnd)) {
                    // searchBy all ending after options.timeStart
                    qb.where('proposals.expired_at', '>', options.timeStart - 1);

                } else if (_.isNil(options.timeStart) && typeof options.timeEnd === 'number') {
                    // searchBy all ending before options.timeEnd
                    qb.where('proposals.expired_at', '<', options.timeEnd + 1);

                } else if (typeof options.timeStart === 'number' && typeof options.timeEnd === 'number') {
                    // searchBy all ending after options.timeStart, starting before options.timeEnd
                    qb.where('proposals.time_start', '<', options.timeEnd + 1);
                    qb.where('proposals.expired_at', '>', options.timeStart - 1);
                }

                if (options.hasFinalResult) {
                    qb.whereNotNull('proposals.final_result_id');
                } else {
                    qb.whereNull('proposals.final_result_id');
                }

                // qb.debug(true);

            })
            .orderBy('time_start', options.order);

        return collection.fetchAll(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public static async fetchById(value: number, withRelated: boolean = true): Promise<Proposal> {
        return Proposal.where<Proposal>({ id: value }).fetch(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public static async fetchByHash(value: string, withRelated: boolean = true): Promise<Proposal> {
        return Proposal.where<Proposal>({ hash: value }).fetch(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public static async fetchByMsgId(value: string, withRelated: boolean = true): Promise<Proposal> {
        return Proposal.where<Proposal>({ msgid: value }).fetch(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public static async fetchByTarget(value: string, withRelated: boolean = true): Promise<Proposal> {
        return Proposal.where<Proposal>({ target: value }).fetch(withRelated ? {withRelated: this.RELATIONS} : undefined);
    }

    public static async fetchExpired(): Promise<Collection<Proposal>> {
        const collection = Proposal.forge<Model<Proposal>>()
            .query(qb => {
                qb.where('expired_at', '<=', Date.now());
            });
        return collection.fetchAll();
    }

    public get tableName(): string { return 'proposals'; }
    public get hasTimestamps(): boolean { return true; }

    public get Id(): number { return this.get('id'); }
    public set Id(value: number) { this.set('id', value); }

    public get Msgid(): string { return this.get('msgid'); }
    public set Msgid(value: string) { this.set('msgid', value); }

    public get Submitter(): string { return this.get('submitter'); }
    public set Submitter(value: string) { this.set('submitter', value); }

    public get Hash(): string { return this.get('hash'); }
    public set Hash(value: string) { this.set('hash', value); }

    public get Target(): string { return this.get('target'); }
    public set Target(value: string) { this.set('target', value); }

    public get Category(): string { return this.get('category'); }
    public set Category(value: string) { this.set('category', value); }

    public get Title(): string { return this.get('title'); }
    public set Title(value: string) { this.set('title', value); }

    public get Description(): string { return this.get('description'); }
    public set Description(value: string) { this.set('description', value); }

    public get Market(): string { return this.get('market'); }
    public set Market(value: string) { this.set('market', value); }

    public get TimeStart(): number { return this.get('timeStart'); }
    public set TimeStart(value: number) { this.set('timeStart', value); }

    public get PostedAt(): number { return this.get('postedAt'); }
    public set PostedAt(value: number) { this.set('postedAt', value); }

    public get ExpiredAt(): number { return this.get('expiredAt'); }
    public set ExpiredAt(value: number) { this.set('expiredAt', value); }

    public get ReceivedAt(): number { return this.get('receivedAt'); }
    public set ReceivedAt(value: number) { this.set('receivedAt', value); }

    public get CreatedAt(): Date { return this.get('createdAt'); }
    public set CreatedAt(value: Date) { this.set('createdAt', value); }

    public get UpdatedAt(): Date { return this.get('updatedAt'); }
    public set UpdatedAt(value: Date) { this.set('updatedAt', value); }

    public ProposalOptions(): Collection<ProposalOption> {
        return this.hasMany(ProposalOption, 'proposal_id', 'id');
    }

    public ProposalResults(): Collection<ProposalResult> {
        return this.hasMany(ProposalResult, 'proposal_id', 'id');
    }

    public FlaggedItems(): Collection<FlaggedItem> {
        return this.hasMany(FlaggedItem, 'proposal_id', 'id');
    }

    // set to the final ProposalResult after Proposal expires
    public FinalProposalResult(): ProposalResult {
        return this.belongsTo(ProposalResult, 'final_result_id', 'id');
    }

}
