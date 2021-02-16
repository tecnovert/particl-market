// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as resources from 'resources';
import * as _ from 'lodash';
import { inject, named } from 'inversify';
import { validate, request } from '../../../core/api/Validate';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { RpcRequest } from '../../requests/RpcRequest';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { Commands } from '../CommandEnumType';
import { BaseCommand } from '../BaseCommand';
import { RpcCommandFactory } from '../../factories/RpcCommandFactory';
import { ProposalAddActionService } from '../../services/action/ProposalAddActionService';
import { MarketService } from '../../services/model/MarketService';
import { ProposalCategory } from '../../enums/ProposalCategory';
import { SmsgSendResponse } from '../../responses/SmsgSendResponse';
import { ModelNotFoundException } from '../../exceptions/ModelNotFoundException';
import { SmsgSendParams } from '../../requests/action/SmsgSendParams';
import { ProposalAddRequest } from '../../requests/action/ProposalAddRequest';
import { IdentityService } from '../../services/model/IdentityService';
import {
    BooleanValidationRule,
    CommandParamValidationRules,
    IdValidationRule,
    MessageRetentionValidationRule,
    ParamValidationRule,
    StringValidationRule
} from '../CommandParamValidation';


export class ProposalPostCommand extends BaseCommand implements RpcCommandInterface<SmsgSendResponse> {

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.action.ProposalAddActionService) public proposalAddActionService: ProposalAddActionService,
        @inject(Types.Service) @named(Targets.Service.model.IdentityService) private identityService: IdentityService,
        @inject(Types.Service) @named(Targets.Service.model.MarketService) public marketService: MarketService
    ) {
        super(Commands.PROPOSAL_POST);
        this.log = new Logger(__filename);
    }

    public getCommandParamValidationRules(): CommandParamValidationRules {
        return {
            params: [
                new IdValidationRule('marketId', true, this.marketService),
                new StringValidationRule('proposalTitle', true),
                new StringValidationRule('proposalDescription', true),
                new MessageRetentionValidationRule('daysRetention', true),
                new BooleanValidationRule('estimateFee', true),
                new StringValidationRule('option1Description', true),
                new StringValidationRule('option2Description', true)
            ] as ParamValidationRule[]
        } as CommandParamValidationRules;
    }

    /**
     * command description
     * [0] market: resources.Market
     * [1] proposalTitle
     * [2] proposalDescription
     * [3] daysRetention
     * [4] estimateFee
     * [5] option1Description
     * [6] option2Description
     * [n...] optionNDescription
     *
     * @param data, RpcRequest
     * @param rpcCommandFactory, RpcCommandFactory
     * @returns {Promise<any>}
     */
    @validate()
    public async execute( @request(RpcRequest) data: RpcRequest, rpcCommandFactory: RpcCommandFactory): Promise<SmsgSendResponse> {

        const market: resources.Market = data.params.shift();
        const title = data.params.shift();
        const description = data.params.shift();
        const daysRetention = data.params.shift();
        const estimateFee = data.params.shift();

        // rest of the data.params are option descriptions, and there are minimum of 2 of those
        const options: string[] = data.params;

        const postRequest = {
            sendParams: {
                wallet: market.Identity.wallet,
                fromAddress: market.Identity.address,      // send from the given identity
                toAddress: market.receiveAddress,
                paid: false,
                daysRetention: daysRetention || parseInt(process.env.FREE_MESSAGE_RETENTION_DAYS, 10),
                estimateFee,
                anonFee: false
            } as SmsgSendParams,
            sender: market.Identity,                // todo: we could use sendParams.from?
            market,
            category: ProposalCategory.PUBLIC_VOTE, // type should always be PUBLIC_VOTE when using this command
            title,
            description,
            options
        } as ProposalAddRequest;

        return await this.proposalAddActionService.post(postRequest);
    }

    /**
     * command description
     *
     * [0] marketId
     * [1] proposalTitle
     * [2] proposalDescription
     * [3] daysRetention
     * [4] estimateFee
     * [5] option1Description
     * [6] option2Description
     * [n...] optionNDescription
     *
     * @param data, RpcRequest
     * @returns {Promise<RpcRequest>}
     */
    public async validate(data: RpcRequest): Promise<RpcRequest> {
        await super.validate(data); // validates the basic search params, see: BaseSearchCommand.validateSearchParams()

        const market: resources.Market = data.params[0];

        // TODO: set the max expiration for proposals of category PUBLIC_VOTE
        // to whatever is the max expiration for free smsg messages

        // make sure Identity with the id exists
        await this.identityService.findOne(market.Identity.id)
            .then(value => value.toJSON())
            .catch(reason => {
                throw new ModelNotFoundException('Identity');
            });

        data.params[0] = market;

        return data;
    }

    public usage(): string {
        return this.getName() + ' <marketId> <proposalTitle> <proposalDescription> <daysRetention> <estimateFee> '
            + '<option1Description> <option2Description> ... [optionNDescription] ';
    }

    public help(): string {
        return this.usage() + ' -  ' + this.description() + ' \n'
            + '    <marketId>               - number, id of the Market. \n'
            + '    <proposalTitle>          - string, title for the Proposal. \n'
            + '    <proposalDescription>    - string, description for the Proposal. \n'
            + '    <daysRetentions>         - number, days retention. \n'
            + '    <estimateFee>            - boolean, estimate the fee, dont post the Proposal. \n'
            + '    <option1Description>     - string, first ProposalOption description. '
            + '    <option2Description>     - string, second ProposalOption description. '
            + '    <optionNDescription>     - [optional] string, ProposalOption description. ';
    }

    public description(): string {
        return ' Post a proposal.';
    }

    public example(): string {
        return this.getName() + ' proposal post 1 "A question of sets" "The set of all sets contains itself?" 1 false YES NO';
    }
}
