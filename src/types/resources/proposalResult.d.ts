// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

declare module 'resources' {

    interface ProposalResult {
        id: number;
        calculatedAt: number;

        Proposal: Proposal;
        ProposalOptionResults: ProposalOptionResult[];

        createdAt: number;
        updatedAt: number;
    }

}
