// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as resources from 'resources';
import * as _ from 'lodash';
import { inject, named } from 'inversify';
import { validate, request } from '../../../core/api/Validate';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { RpcRequest } from '../../requests/RpcRequest';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { MessageException } from '../../exceptions/MessageException';
import { Commands} from '../CommandEnumType';
import { BaseCommand } from '../BaseCommand';
import { SmsgSendResponse } from '../../responses/SmsgSendResponse';
import { BidService } from '../../services/model/BidService';
import { BidRejectActionService } from '../../services/action/BidRejectActionService';
import { SmsgSendParams } from '../../requests/action/SmsgSendParams';
import { InvalidParamException } from '../../exceptions/InvalidParamException';
import { ModelNotFoundException } from '../../exceptions/ModelNotFoundException';
import { MPAction} from '@zasmilingidiot/omp-lib/dist/interfaces/omp-enums';
import { BidRejectReason } from '../../enums/BidRejectReason';
import { BidRejectRequest } from '../../requests/action/BidRejectRequest';
import { IdentityService } from '../../services/model/IdentityService';
import { DefaultSettingService } from '../../services/DefaultSettingService';
import { CommandParamValidationRules, EnumValidationRule, IdValidationRule, ParamValidationRule } from '../CommandParamValidation';
import { EnumHelper } from '../../../core/helpers/EnumHelper';


export class BidRejectCommand extends BaseCommand implements RpcCommandInterface<SmsgSendResponse> {

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.model.BidService) private bidService: BidService,
        @inject(Types.Service) @named(Targets.Service.model.IdentityService) private identityService: IdentityService,
        @inject(Types.Service) @named(Targets.Service.action.BidRejectActionService) private bidRejectActionService: BidRejectActionService
    ) {
        super(Commands.BID_REJECT);
        this.log = new Logger(__filename);
    }

    public getCommandParamValidationRules(): CommandParamValidationRules {
        return {
            params: [
                new IdValidationRule('bidId', true, this.bidService),
                new IdValidationRule('identityId', true, this.identityService),
                new EnumValidationRule('bidRejectReason', false, 'BidRejectReason',
                    EnumHelper.getValues(BidRejectReason) as string[], BidRejectReason.NO_REASON)
            ] as ParamValidationRule[]
        } as CommandParamValidationRules;
    }

    /**
     * data.params[]:
     * [0]: bid, resources.Bid
     * [1]: identity, resources.Identity
     * [2]: reason: BidRejectReason, optional
     *
     * @param {RpcRequest} data
     * @returns {Promise<SmsgSendResponse>}
     */
    @validate()
    public async execute( @request(RpcRequest) data: RpcRequest): Promise<SmsgSendResponse> {
        const bid: resources.Bid = data.params[0];
        const identity: resources.Identity = data.params[1];
        const reason: BidRejectReason = data.params[2];

        const postRequest = {
            sendParams: {
                wallet: identity.wallet,
                fromAddress: identity.address,
                toAddress: bid.OrderItem.Order.buyer,
                paid: false,
                daysRetention: parseInt(process.env.FREE_MESSAGE_RETENTION_DAYS || `${DefaultSettingService.FREE_MESSAGE_RETENTION_DAYS}`, 10),
                estimateFee: false,
                anonFee: false
            } as SmsgSendParams,
            bid,
            reason
        } as BidRejectRequest;

        return this.bidRejectActionService.post(postRequest);
    }

    /**
     * data.params[]:
     * [0]: bidId
     * [1]: identityId
     * [2]: reason: BidRejectReason, optional
     *
     * @param {RpcRequest} data
     * @returns {Promise<RpcRequest>}
     */
    public async validate(data: RpcRequest): Promise<RpcRequest> {
        await super.validate(data);

        const bid: resources.Bid = data.params[0];
        const identity: resources.Identity = data.params[1];

        if (data.params.length >= 3) {
            const reason = data.params[2];
            if ((typeof reason !== 'string') || (!BidRejectReason[reason])) {
                throw new InvalidParamException('reasonEnum', 'BidRejectReason');
            }
            data.params[2] = BidRejectReason[reason];
        }

        // make sure ListingItem exists
        if (_.isEmpty(bid.ListingItem)) {
            this.log.error('ListingItem not found.');
            throw new ModelNotFoundException('ListingItem');
        }

        // make sure we have a ListingItemTemplate, so we know we are the seller
        if (_.isEmpty(bid.ListingItem.ListingItemTemplate)) {
            throw new ModelNotFoundException('ListingItemTemplate');
        }

        // make sure the Bid has not been accepted yet
        const childBid: resources.Bid | undefined = _.find(bid.ChildBids, (child) => child.type === MPAction.MPA_ACCEPT);
        if (childBid) {
            throw new MessageException('Bid has already been accepted.');
        }

        if (identity.address !== bid.OrderItem.Order.seller) {
            // TODO: add this validation to other escrow/bid commands
            // TODO: passing the identityId might not even be necessary
            throw new MessageException('Given Identity does not belong to the seller.');
        }

        data.params[0] = bid;
        data.params[1] = identity;

        return data;
    }

    public usage(): string {
        return this.getName() + ' <bidId> <identityId> [reason] ';
    }

    public help(): string {
        return this.usage() + ' -  ' + this.description() + '\n'
        + '    <bidId>                  - number, the ID of the Bid we want to reject. '
        + '    <identityId>             - number, the id of the Identity used to cancel to Bid. '
        + '    <bidRejectReason>        - [optional] BidRejectReason - The predefined reason you want to specify for cancelling the Bid. ';
    }

    public description(): string {
        return 'Reject a Bid.';
    }

    public example(): string {
        return 'bid ' + this.getName() + ' 1 OUT_OF_STOCK ';
    }
}
