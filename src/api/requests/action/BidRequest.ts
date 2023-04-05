// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as resources from 'resources';
import { IsNotEmpty } from 'class-validator';
import { RequestBody } from '../../../core/api/RequestBody';
import { ActionRequestInterface } from './ActionRequestInterface';
import { SmsgSendParams } from './SmsgSendParams';
import {AddressCreateRequest} from '../model/AddressCreateRequest';

export class BidRequest extends RequestBody implements ActionRequestInterface {

    @IsNotEmpty()
    public sendParams: SmsgSendParams;          // PostRequest always needs to contain the send parameters for the message
    @IsNotEmpty()
    public listingItem: resources.ListingItem;  // ListingItem being bidded for
    @IsNotEmpty()
    public market: resources.Market;            // Market which the ListingItem is being bidded on
    @IsNotEmpty()
    public address: AddressCreateRequest;       // bidder delivery address

}
