// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

declare module 'resources' {

    interface ProposalOptionResult {
        id: number;
        weight: number;
        voters: number;
        ProposalOption: ProposalOption;
        ProposalResult: ProposalResult;

        createdAt: Date;
        updatedAt: Date;
    }

}
