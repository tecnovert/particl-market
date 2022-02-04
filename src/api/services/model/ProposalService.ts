// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as Bookshelf from 'bookshelf';
import * as resources from 'resources';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { validate, request } from '../../../core/api/Validate';
import { NotFoundException } from '../../exceptions/NotFoundException';
import { ProposalRepository } from '../../repositories/ProposalRepository';
import { Proposal } from '../../models/Proposal';
import { ProposalCreateRequest } from '../../requests/model/ProposalCreateRequest';
import { ProposalUpdateRequest } from '../../requests/model/ProposalUpdateRequest';
import { ProposalOptionService } from './ProposalOptionService';
import { ProposalSearchParams } from '../../requests/search/ProposalSearchParams';
import { ProposalOptionResultUpdateRequest } from '../../requests/model/ProposalOptionResultUpdateRequest';
import { CoreRpcService } from '../CoreRpcService';
import { ProposalResultService } from './ProposalResultService';
import { ProposalOptionResultService } from './ProposalOptionResultService';
import { ProposalOptionResultCreateRequest } from '../../requests/model/ProposalOptionResultCreateRequest';
import { ProposalResultCreateRequest } from '../../requests/model/ProposalResultCreateRequest';
import { VoteService } from './VoteService';
import { VoteUpdateRequest } from '../../requests/model/VoteUpdateRequest';
import { MarketService } from './MarketService';


export class ProposalService {

    public log: LoggerType;

    constructor(
        @inject(Types.Service) @named(Targets.Service.CoreRpcService) public coreRpcService: CoreRpcService,
        @inject(Types.Service) @named(Targets.Service.model.ProposalOptionService) public proposalOptionService: ProposalOptionService,
        @inject(Types.Service) @named(Targets.Service.model.ProposalResultService) public proposalResultService: ProposalResultService,
        @inject(Types.Service) @named(Targets.Service.model.VoteService) public voteService: VoteService,
        @inject(Types.Service) @named(Targets.Service.model.ProposalOptionResultService) public proposalOptionResultService: ProposalOptionResultService,
        @inject(Types.Service) @named(Targets.Service.model.MarketService) public marketService: MarketService,
        @inject(Types.Repository) @named(Targets.Repository.ProposalRepository) public proposalRepo: ProposalRepository,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    public async search(options: ProposalSearchParams, withRelated: boolean = true): Promise<Bookshelf.Collection<Proposal>> {
        return await this.proposalRepo.search(options, withRelated);
    }

    public async findAll(withRelated: boolean = true): Promise<Bookshelf.Collection<Proposal>> {
        return await this.proposalRepo.findAll(withRelated);
    }

    public async findAllExpired(): Promise<Bookshelf.Collection<Proposal>> {
        return await this.proposalRepo.findAllExpired();
    }

    public async findAllByMarket(market: string, withRelated: boolean = true): Promise<Bookshelf.Collection<Proposal>> {
        return await this.proposalRepo.findAllByMarket(market, withRelated);
    }

    public async findOne(id: number, withRelated: boolean = true): Promise<Proposal> {
        const proposal = await this.proposalRepo.findOne(id, withRelated);
        if (proposal === null) {
            this.log.warn(`Proposal with the id=${id} was not found!`);
            throw new NotFoundException(id);
        }
        return proposal;
    }

    public async findOneByHash(hash: string, withRelated: boolean = true): Promise<Proposal> {
        const proposal = await this.proposalRepo.findOneByHash(hash, withRelated);
        if (proposal === null) {
            this.log.warn(`Proposal with the hash=${hash} was not found!`);
            throw new NotFoundException(hash);
        }
        return proposal;
    }

    public async findOneByTarget(listingItemHash: string, withRelated: boolean = true): Promise<Proposal> {
        const proposal = await this.proposalRepo.findOneByTarget(listingItemHash, withRelated);
        if (proposal === null) {
            this.log.warn(`Proposal with the listingItemHash=${listingItemHash} was not found!`);
            throw new NotFoundException(listingItemHash);
        }
        return proposal;
    }

    public async findOneByMsgId(msgId: string, withRelated: boolean = true): Promise<Proposal> {
        const smsgMessage = await this.proposalRepo.findOneByMsgId(msgId, withRelated);
        if (smsgMessage === null) {
            this.log.warn(`SmsgMessage with the msgid=${msgId} was not found!`);
            throw new NotFoundException(msgId);
        }
        return smsgMessage;
    }

    @validate()
    public async create( @request(ProposalCreateRequest) data: ProposalCreateRequest): Promise<Proposal> {
        const body = JSON.parse(JSON.stringify(data));
        // this.log.debug('create Proposal, body: ', JSON.stringify(body, null, 2));

        // extract and remove related models from request
        const options = body.options || [];
        delete body.options;

        // if the request body was valid we will create the proposal
        const proposal = await this.proposalRepo.create(body);

        // create related options
        let optionId = 0;
        for (const optionCreateRequest of options) {
            optionCreateRequest.proposal_id = proposal.id;
            // optionCreateRequest.proposalHash = body.hash; // TODO: skipping this for now, needs some refactoring to add this
            if (!optionCreateRequest.optionId) {
                optionCreateRequest.optionId = optionId;
                optionId++;
            }
            // this.log.debug('optionCreateRequest: ', JSON.stringify(optionCreateRequest, null, 2));
            await this.proposalOptionService.create(optionCreateRequest);
        }

        return await this.findOne(proposal.id, true);
    }

    @validate()
    public async update(id: number, @request(ProposalUpdateRequest) data: ProposalUpdateRequest): Promise<Proposal> {

        const body = JSON.parse(JSON.stringify(data));

        const proposal = await this.findOne(id, false);

        proposal.Submitter = body.submitter;
        proposal.Hash = body.hash;
        proposal.Target = body.target;
        proposal.Category = body.category;
        proposal.Title = body.title;
        proposal.Description = body.description;
        proposal.Market = body.market;
        proposal.TimeStart = body.timeStart;
        proposal.PostedAt = body.postedAt;
        proposal.ExpiredAt = body.expiredAt;
        proposal.ReceivedAt = body.receivedAt;

        return await this.proposalRepo.update(id, proposal.toJSON());
    }

    public async updateTimes(id: number, timeStart: number, postedAt: number, receivedAt: number, expiredAt: number): Promise<Proposal> {
        const proposal = await this.findOne(id, false);
        proposal.set('timeStart', timeStart);
        proposal.set('postedAt', postedAt);
        proposal.set('receivedAt', receivedAt);
        proposal.set('expiredAt', expiredAt);
        await this.proposalRepo.update(id, proposal.toJSON());
        return await this.findOne(id);
    }

    public async destroy(id: number): Promise<void> {
        await this.proposalRepo.destroy(id);
    }


    /**
     * creates empty ProposalResult for the Proposal
     * todo: perhaps create one after call to proposalservice.create, so this doesnt need to be called from anywhere else
     *
     * @param {"resources".Proposal} proposal
     * @returns {Promise<"resources".ProposalResult>}
     */
    public async createEmptyProposalResult(proposal: resources.Proposal): Promise<resources.ProposalResult> {
        const calculatedAt: number = Date.now();

        const proposalResultCreateRequest = {
            calculatedAt,
            proposal_id: proposal.id
        } as ProposalResultCreateRequest;
        // this.log.debug('createEmptyProposalResult(), proposalResultCreateRequest:', JSON.stringify(proposalResultCreateRequest, null, 2));

        let proposalResult: resources.ProposalResult = await this.proposalResultService.create(proposalResultCreateRequest)
            .then(value => value.toJSON());

        for (const proposalOption of proposal.ProposalOptions) {
            const proposalOptionResultCreateRequest = {
                weight: 0,
                voters: 0,
                proposal_option_id: proposalOption.id,
                proposal_result_id: proposalResult.id
            } as ProposalOptionResultCreateRequest;
            // this.log.debug('createEmptyProposalResult(), proposalOptionResultCreateRequest:', JSON.stringify(proposalOptionResultCreateRequest, null, 2));
            const proposalOptionResult: resources.ProposalOptionResult = await this.proposalOptionResultService.create(proposalOptionResultCreateRequest)
                .then(value => value.toJSON());
            // this.log.debug('createEmptyProposalResult(), proposalOptionResult:', JSON.stringify(proposalOptionResult, null, 2));
        }

        proposalResult = await this.proposalResultService.findOne(proposalResult.id).then(value => value.toJSON());
        // this.log.debug('createEmptyProposalResult(), proposalResult:', JSON.stringify(proposalResult, null, 2));

        return proposalResult;
    }


    /**
     * - recalculateProposalResult(proposal):
     *   - create new ProposalResult
     *   - create new ProposalOptionResultCreateRequests for all options
     *   - get all existing votes for Proposal
     *   - for (vote: votes)
     *     - check vote.address balance, update Vote if it has changed
     *     - add vote to new ProposalOptionResult
     *     - add vote.weight to proposalOptionResult.weight + voters
     *   - save ProposalOptionResultCreateRequests
     *
     * @param proposal
     * @param test, skips getaddressbalance rpc call for test data generation
     * @returns {Promise<"resources".ProposalResult>}
     */
    public async recalculateProposalResult(proposal: resources.Proposal, test: boolean = false): Promise<resources.ProposalResult> {

        // create new empty ProposalResult
        let proposalResult: resources.ProposalResult = await this.createEmptyProposalResult(proposal);

        // create UpdateRequests for those just created ProposalOptionResults
        // store them in a map for easy access
        const proposalOptionResultUpdateRequests = new Map<number, ProposalOptionResultUpdateRequest>();
        for (const proposalOptionResult of proposalResult.ProposalOptionResults) {
            const proposalOptionResultUpdateRequest = {
                weight: 0,
                voters: 0,
                proposal_option_id: proposalOptionResult.ProposalOption.id,
                proposal_result_id: proposalResult.id
            } as ProposalOptionResultUpdateRequest;
            proposalOptionResultUpdateRequest['id'] = proposalOptionResult.id; // stored just for easy update, removed later
            proposalOptionResultUpdateRequests.set(proposalOptionResult.ProposalOption.optionId, proposalOptionResultUpdateRequest);
        }

        // get all proposal votes
        const votes: resources.Vote[] = await this.voteService.findAllByProposalHash(proposal.hash)
            .then(value => value.toJSON());

        // this.log.debug('recalculateProposalResult(), votes:', JSON.stringify(votes, null, 2));

        // update all votes balances
        // add vote weights to ProposalOptionResultUpdateRequests
        for (const vote of votes) {
            let balance = 0;
            // get the address balance
            if (!test) { // todo: skipping balance update for test data generation
                balance = await this.coreRpcService.getAddressBalance(vote.voter).then(value => parseInt(value.balance, 10));
            }

            // update vote weight in case it's changed
            if (vote.weight !== balance) {
                await this.voteService.update(vote.id, {
                    weight: balance
                } as VoteUpdateRequest);
            }

            // add weight and voters to ProposalOptionResultUpdateRequest
            const proposalOptionResultUpdateRequest = proposalOptionResultUpdateRequests.get(vote.ProposalOption.optionId);
            if (proposalOptionResultUpdateRequest) {
                proposalOptionResultUpdateRequest.weight = proposalOptionResultUpdateRequest.weight + vote.weight;
                proposalOptionResultUpdateRequest.voters++;
                proposalOptionResultUpdateRequests.set(vote.ProposalOption.optionId, proposalOptionResultUpdateRequest);
            }
        }

        for (const [optionId, proposalOptionResultUpdateRequest] of proposalOptionResultUpdateRequests) {
            // this.log.debug('recalculateProposalResult(), update optionId: ', optionId);
            const proposalOptionResultId = proposalOptionResultUpdateRequest['id'];
            delete proposalOptionResultUpdateRequest['id'];
            // const updatedProposalOptionResult: resources.ProposalOptionResult =
            await this.proposalOptionResultService.update(proposalOptionResultId, proposalOptionResultUpdateRequest)
                .then(value => value.toJSON());
            // this.log.debug('recalculateProposalResult(), updatedProposalOptionResult: ', JSON.stringify(updatedProposalOptionResult, null, 2));
        }

        proposalResult = await this.proposalResultService.findOne(proposalResult.id).then(value => value.toJSON());

        // this.log.debug('recalculateProposalResult(), proposalResult: ', JSON.stringify(proposalResult, null, 2));
        // this.log.debug('recalculateProposalResult(), proposal: ' + proposalResult.id);
        for (const proposalOptionResult of proposalResult.ProposalOptionResults) {
            this.log.debug('recalculateProposalResult(), proposal: ' + proposalOptionResult.ProposalOption.description + ': ' + proposalOptionResult.weight);
        }
        return proposalResult;
    }

    /**
     *
     * @param proposalId
     * @param proposalResultId
     */
    public async setFinalProposalResult(proposalId: number, proposalResultId: number): Promise<Proposal> {
        const proposal: Proposal = await this.findOne(proposalId, false);
        proposal.set('finalResultId', proposalResultId);
        await this.proposalRepo.update(proposalId, proposal.toJSON());
        return await this.findOne(proposalId);
    }

}
