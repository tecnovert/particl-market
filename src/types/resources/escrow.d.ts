// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { EscrowType } from '@zasmilingidiot/omp-lib/dist/interfaces/omp-enums';
import { EscrowReleaseType } from '@zasmilingidiot/omp-lib/dist/interfaces/omp-enums';

declare module 'resources' {


    interface Escrow {
        id: number;
        type: EscrowType;
        secondsToLock: number;
        releaseType: EscrowReleaseType;
        createdAt: Date;
        updatedAt: Date;
        Ratio: EscrowRatio;
    }

}
