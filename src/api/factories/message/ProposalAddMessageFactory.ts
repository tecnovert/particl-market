// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as resources from 'resources';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../../core/Logger';
import { Core, Types } from '../../../constants';
import { ProposalAddMessage } from '../../messages/action/ProposalAddMessage';
import { ConfigurableHasher } from '@zasmilingidiot/omp-lib/dist/hasher/hash';
import { HashableProposalAddMessageConfig } from '../hashableconfig/message/HashableProposalAddMessageConfig';
import { HashableProposalOptionMessageConfig } from '../hashableconfig/message/HashableProposalOptionMessageConfig';
import { HashableProposalAddField, HashableProposalOptionField } from '../hashableconfig/HashableField';
import { GovernanceAction } from '../../enums/GovernanceAction';
import { HashableFieldValueConfig } from '@zasmilingidiot/omp-lib/dist/interfaces/configs';
import { ProposalAddRequest } from '../../requests/action/ProposalAddRequest';
import { MarketplaceMessage } from '../../messages/MarketplaceMessage';
import { BaseMessageFactory } from '../BaseMessageFactory';

export class ProposalAddMessageFactory extends BaseMessageFactory {

    public log: LoggerType;

    constructor(@inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType) {
        super();
        this.log = new Logger(__filename);
    }

    /**
     *
     * @param actionRequest
     * @returns {Promise<MarketplaceMessage>}
     */
    public async get(actionRequest: ProposalAddRequest): Promise<MarketplaceMessage> {

        const optionsList: resources.ProposalOption[] = this.createOptionsList(actionRequest.options);

        const message: ProposalAddMessage = {
            type: GovernanceAction.MPA_PROPOSAL_ADD,
            submitter: actionRequest.sender.address,
            title: actionRequest.title,
            description: actionRequest.description,
            options: optionsList,
            category: actionRequest.category,
            target: actionRequest.target ? actionRequest.target : '' // todo: ffs, allow undefined in ConfigurableHasher
        } as ProposalAddMessage;

        // hash the proposal
        let hashableOptions = '';
        for (const option of optionsList) {
            hashableOptions = `${hashableOptions}${option.optionId}:${option.description}:`;
        }

        // this.log.debug('message: ', JSON.stringify(message, null, 2));

        // todo:
        message.hash = ConfigurableHasher.hash(message, new HashableProposalAddMessageConfig([{
            value: hashableOptions,
            to: HashableProposalAddField.PROPOSAL_OPTIONS
        }, {
            value: actionRequest.market.receiveAddress,
            to: HashableProposalAddField.PROPOSAL_MARKET
        }] as HashableFieldValueConfig[]));

        // add hashes for the options too
        for (const option of optionsList) {
            option.hash = ConfigurableHasher.hash(option, new HashableProposalOptionMessageConfig([{
                value: message.hash,
                to: HashableProposalOptionField.PROPOSALOPTION_PROPOSAL_HASH
            }]));
        }

        return await this.getMarketplaceMessage(message);
    }

    private createOptionsList(options: string[]): resources.ProposalOption[] {
        const optionsList: resources.ProposalOption[] = [];
        let optionId = 0;

        for (const description of options) {
            const option = {
                optionId,
                description
            } as resources.ProposalOption;
            optionsList.push(option);
            optionId++;
        }
        optionsList.sort(((a, b) => a.optionId > b.optionId ? 1 : -1));
        return optionsList;
    }

}
