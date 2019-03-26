// Copyright (c) 2017-2019, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { ValidateIf, IsEnum, IsNotEmpty } from 'class-validator';
import { RequestBody } from '../../core/api/RequestBody';
import {ImageDataProtocolType} from '../enums/ImageDataProtocolType';

// tslint:disable:variable-name
export class ItemImageDataCreateRequest extends RequestBody {

    public item_image_id: number;
    public dataId: string;

    @IsNotEmpty()
    public protocol: ImageDataProtocolType;

    @IsNotEmpty()
    public imageVersion: string;

    @IsNotEmpty()
    public imageHash: string;

    public encoding: string;
    public data: string;
    public originalMime: string;
    public originalName: string;

}
// tslint:enable:variable-name
