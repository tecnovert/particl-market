// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { ProposalCategory } from '../../api/enums/ProposalCategory';

declare module 'resources' {

    interface Proposal {
        id: number;
        msgid: string;
        submitter: string;
        hash: string;
        target: string;
        category: ProposalCategory;
        title: string;
        description: string;
        market: string;

        timeStart: number;
        receivedAt: number;
        postedAt: number;
        expiredAt: number;

        createdAt: Date;
        updatedAt: Date;

        ProposalOptions: ProposalOption[];
        ProposalResults: ProposalResult[];
        FlaggedItems: FlaggedItem[];

    }

}
