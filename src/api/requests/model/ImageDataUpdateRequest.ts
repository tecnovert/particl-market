// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { IsEnum, IsNotEmpty } from 'class-validator';
import { RequestBody } from '../../../core/api/RequestBody';
import { ProtocolDSN } from '@zasmilingidiot/omp-lib/dist/interfaces/dsn';
import { ModelRequestInterface } from './ModelRequestInterface';


export class ImageDataUpdateRequest extends RequestBody implements ModelRequestInterface {

    // @IsNotEmpty()
    public image_id: number;
    public dataId: string;

    @IsEnum(ProtocolDSN)
    @IsNotEmpty()
    public protocol: ProtocolDSN;

    @IsNotEmpty()
    public imageVersion: string;

    @IsNotEmpty()
    public imageHash: string;

    public encoding: string;
    public data: string;
    public originalMime: string;
    public originalName: string;

}
