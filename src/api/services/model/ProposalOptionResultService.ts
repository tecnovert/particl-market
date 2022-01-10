// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Bookshelf from 'bookshelf';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { validate, request } from '../../../core/api/Validate';
import { NotFoundException } from '../../exceptions/NotFoundException';
import { ProposalOptionResultRepository } from '../../repositories/ProposalOptionResultRepository';
import { ProposalOptionResult } from '../../models/ProposalOptionResult';
import { ProposalOptionResultCreateRequest } from '../../requests/model/ProposalOptionResultCreateRequest';
import { ProposalOptionResultUpdateRequest } from '../../requests/model/ProposalOptionResultUpdateRequest';

export class ProposalOptionResultService {

    public log: LoggerType;

    constructor(
        @inject(Types.Repository) @named(Targets.Repository.ProposalOptionResultRepository) public proposalOptionResultRepo: ProposalOptionResultRepository,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    public async findAll(): Promise<Bookshelf.Collection<ProposalOptionResult>> {
        return this.proposalOptionResultRepo.findAll();
    }

    public async findOne(id: number, withRelated: boolean = true): Promise<ProposalOptionResult> {
        const proposalOptionResult = await this.proposalOptionResultRepo.findOne(id, withRelated);
        if (proposalOptionResult === null) {
            this.log.warn(`ProposalOptionResult with the id=${id} was not found!`);
            throw new NotFoundException(id);
        }
        return proposalOptionResult;
    }

    @validate()
    public async create( @request(ProposalOptionResultCreateRequest) data: ProposalOptionResultCreateRequest): Promise<ProposalOptionResult> {

        const body = JSON.parse(JSON.stringify(data));
        // this.log.debug('create ProposalOptionResult, body: ', JSON.stringify(body, null, 2));

        // If the request body was valid we will create the proposalOptionResult
        const proposalOptionResult = await this.proposalOptionResultRepo.create(body);

        // finally find and return the created proposalOptionResult
        const newProposalOptionResult = await this.findOne(proposalOptionResult.id);
        return newProposalOptionResult;
    }

    @validate()
    public async update(id: number, @request(ProposalOptionResultUpdateRequest) body: ProposalOptionResultUpdateRequest): Promise<ProposalOptionResult> {

        // find the existing one without related
        const proposalOptionResult = await this.findOne(id, false);

        // set new values
        // proposalOptionResult.ProposalResultId = body.proposalResultId;
        // proposalOptionResult.ProposalOptionId = body.proposalOptionId;
        // proposalOptionResult.Weight = body.weight;
        // proposalOptionResult.Voters = body.voters;

        proposalOptionResult.set('weight', body.weight);
        proposalOptionResult.set('voters', body.voters);
        proposalOptionResult.set('proposalResultId', body.proposal_result_id);
        proposalOptionResult.set('proposalOptionId', body.proposal_option_id);

        // update proposalOptionResult record
        const updatedProposalOptionResult = await this.proposalOptionResultRepo.update(id, proposalOptionResult.toJSON());

        // const newProposalOptionResult = await this.findOne(id);
        // return newProposalOptionResult;

        return updatedProposalOptionResult;
    }

    public async destroy(id: number): Promise<void> {
        await this.proposalOptionResultRepo.destroy(id);
    }

}
