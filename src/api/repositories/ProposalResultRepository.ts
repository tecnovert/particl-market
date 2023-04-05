// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Bookshelf from 'bookshelf';
import { inject, named } from 'inversify';
import { Types, Core, Targets } from '../../constants';
import { ProposalResult } from '../models/ProposalResult';
import { DatabaseException } from '../exceptions/DatabaseException';
import { NotFoundException } from '../exceptions/NotFoundException';
import { Logger as LoggerType } from '../../core/Logger';

export class ProposalResultRepository {

    public log: LoggerType;

    constructor(
        @inject(Types.Model) @named(Targets.Model.ProposalResult) public ProposalResultModel: typeof ProposalResult,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    public async findAll(): Promise<Bookshelf.Collection<ProposalResult>> {
        const list = await this.ProposalResultModel.fetchAll<ProposalResult>();
        return list;
    }

    public async findAllByProposalHash(hash: string, withRelated: boolean = true): Promise<Bookshelf.Collection<ProposalResult>> {
        return await this.ProposalResultModel.fetchAllByProposalHash(hash, withRelated);
    }

    public async findOne(id: number, withRelated: boolean = true): Promise<ProposalResult> {
        return await this.ProposalResultModel.fetchById(id, withRelated);
    }

    public async create(data: any): Promise<ProposalResult> {
        const proposalResult = this.ProposalResultModel.forge<ProposalResult>(data);
        try {
            const proposalResultCreated = await proposalResult.save();
            return await this.ProposalResultModel.fetchById(proposalResultCreated.id);
        } catch (error: any) {
            this.log.error(`Could not create the proposalResult! ${error}`);
            throw new DatabaseException('Could not create the proposalResult!', error);
        }
    }

    public async update(id: number, data: any): Promise<ProposalResult> {
        const proposalResult = this.ProposalResultModel.forge<ProposalResult>({ id });
        try {
            const proposalResultUpdated = await proposalResult.save(data, { patch: true });
            return await this.ProposalResultModel.fetchById(proposalResultUpdated.id);
        } catch (error) {
            throw new DatabaseException('Could not update the proposalResult!', error);
        }
    }

    public async destroy(id: number): Promise<void> {
        let proposalResult = this.ProposalResultModel.forge<ProposalResult>({ id });
        try {
            proposalResult = await proposalResult.fetch({ require: true });
        } catch (error) {
            throw new NotFoundException(id);
        }

        try {
            await proposalResult.destroy();
            return;
        } catch (error) {
            throw new DatabaseException('Could not delete the proposalResult!', error);
        }
    }

}
