// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { BaseHashableConfig, HashableFieldConfig, HashableFieldValueConfig } from 'omp-lib/dist/interfaces/configs';
import { HashableProposalAddField } from '../HashableField';

export class HashableProposalCreateRequestConfig extends BaseHashableConfig {

    public fields = [{
        from: 'submitter',
        to: HashableProposalAddField.PROPOSAL_SUBMITTER
    }, {
        from: 'category',
        to: HashableProposalAddField.PROPOSAL_CATEGORY
    }, {
        from: 'title',
        to: HashableProposalAddField.PROPOSAL_TITLE
    }, {
        from: 'description',
        to: HashableProposalAddField.PROPOSAL_DESCRIPTION
    }, {
        from: 'target',
        to: HashableProposalAddField.PROPOSAL_TARGET
    }] as HashableFieldConfig[];

    /**
     * HashableProposalAddField.PROPOSAL_OPTIONS and  HashableProposalAddField.PROPOSAL_MARKET should be added manually
     * @param values
     */
    constructor(values?: HashableFieldValueConfig[]) {
        super(values);
    }
}
