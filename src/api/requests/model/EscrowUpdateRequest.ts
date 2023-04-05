// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { IsNotEmpty, IsEnum } from 'class-validator';
import { RequestBody } from '../../../core/api/RequestBody';
import { EscrowReleaseType, EscrowType } from '@zasmilingidiot/omp-lib/dist/interfaces/omp-enums';
import { EscrowRatioUpdateRequest } from './EscrowRatioUpdateRequest';
import { ModelRequestInterface } from './ModelRequestInterface';

// tslint:disable:variable-name
export class EscrowUpdateRequest extends RequestBody implements ModelRequestInterface {

    @IsEnum(EscrowType)
    @IsNotEmpty()
    public type: EscrowType;

    public secondsToLock: number;

    @IsEnum(EscrowReleaseType)
    public releaseType: EscrowReleaseType;

    public ratio: EscrowRatioUpdateRequest;

}
// tslint:enable:variable-name
