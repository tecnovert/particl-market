// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import * as resources from 'resources';
import { Logger as LoggerType } from '../../../core/Logger';
import { inject, named } from 'inversify';
import { validate, request } from '../../../core/api/Validate';
import { Types, Core, Targets } from '../../../constants';
import { RpcRequest } from '../../requests/RpcRequest';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { Commands} from '../CommandEnumType';
import { BaseCommand } from '../BaseCommand';
import { MessageException } from '../../exceptions/MessageException';
import { OrderItemStatus } from '../../enums/OrderItemStatus';
import { OrderItemService } from '../../services/model/OrderItemService';
import { MPAction } from 'omp-lib/dist/interfaces/omp-enums';
import { ModelNotFoundException } from '../../exceptions/ModelNotFoundException';
import { SmsgSendResponse } from '../../responses/SmsgSendResponse';
import { SmsgSendParams } from '../../requests/action/SmsgSendParams';
import { BidService } from '../../services/model/BidService';
import { EscrowRefundActionService } from '../../services/action/EscrowRefundActionService';
import { EscrowRefundRequest } from '../../requests/action/EscrowRefundRequest';
import { IdentityService } from '../../services/model/IdentityService';
import { CommandParamValidationRules, IdValidationRule, ParamValidationRule, StringValidationRule } from '../CommandParamValidation';


export class EscrowRefundCommand extends BaseCommand implements RpcCommandInterface<SmsgSendResponse> {

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.action.EscrowRefundActionService) private escrowRefundActionService: EscrowRefundActionService,
        @inject(Types.Service) @named(Targets.Service.model.IdentityService) private identityService: IdentityService,
        @inject(Types.Service) @named(Targets.Service.model.BidService) private bidService: BidService,
        @inject(Types.Service) @named(Targets.Service.model.OrderItemService) private orderItemService: OrderItemService
    ) {
        super(Commands.ESCROW_REFUND);
        this.log = new Logger(__filename);
    }

    public getCommandParamValidationRules(): CommandParamValidationRules {
        return {
            params: [
                new IdValidationRule('orderItemId', true, this.orderItemService),
                new StringValidationRule('memo', false)
            ] as ParamValidationRule[]
        } as CommandParamValidationRules;
    }

    /**
     * data.params[]:
     *   [0]: orderItem: resources.OrderItem
     *   [1]: memo
     *   [2]: identity, resources.Identity
     * @param data
     * @returns {Promise<SmsgSendResponse>}
     */
    @validate()
    public async execute( @request(RpcRequest) data: RpcRequest): Promise<SmsgSendResponse> {

        const orderItem: resources.OrderItem = data.params[0];
        const memo: string = data.params[1];
        const identity: resources.Identity = data.params[2];

        // this.log.debug('orderItem:', JSON.stringify(orderItem, null, 2));

        const bid: resources.Bid = await this.bidService.findOne(orderItem.Bid.id).then(value => value.toJSON());
        let bidAccept: resources.Bid | undefined = _.find(bid.ChildBids, (child) => {
            return child.type === MPAction.MPA_ACCEPT;
        });
        if (!bidAccept) {
            throw new MessageException('No accepted Bid found.');
        }
        bidAccept = await this.bidService.findOne(bidAccept.id).then(value => value.toJSON());

        let escrowLock: resources.Bid | undefined = _.find(bid.ChildBids, (child) => {
            return child.type === MPAction.MPA_LOCK;
        });
        if (!escrowLock) {
            throw new MessageException('No locked Bid found.');
        }
        escrowLock = await this.bidService.findOne(escrowLock.id).then(value => value.toJSON());

        const postRequest = {
            sendParams: {
                wallet: identity.wallet,
                fromAddress: identity.address,
                toAddress: orderItem.Order.seller,
                paid: false,
                daysRetention: parseInt(process.env.FREE_MESSAGE_RETENTION_DAYS, 10),
                estimateFee: false,
                anonFee: false
            } as SmsgSendParams,
            bid,
            bidAccept,
            escrowLock,
            memo
        } as EscrowRefundRequest;

        return this.escrowRefundActionService.post(postRequest);
    }

    /**
     * data.params[]:
     * [0]: orderItemId
     * [1]: memo
     * @param data
     * @returns {Promise<any>}
     */
    public async validate(data: RpcRequest): Promise<RpcRequest> {
        await super.validate(data);

        const orderItem: resources.OrderItem = data.params[0];
        const memo: string = data.params[1];

        // TODO: check these
        const validOrderItemStatuses = [
            OrderItemStatus.ESCROW_LOCKED,
            OrderItemStatus.ESCROW_COMPLETED,
            OrderItemStatus.SHIPPING
        ];

        // check if in the right state.
        if (validOrderItemStatuses.indexOf(orderItem.status) === -1) {
            this.log.error('OrderItem has invalid status');
            throw new MessageException('OrderItem has invalid status');
        }

        const identity: resources.Identity = await this.identityService.findOneByAddress(orderItem.Order.buyer)
            .then(value => value.toJSON())
            .catch(reason => {
                throw new ModelNotFoundException('Identity');
            });

        // TODO: check that we are the seller
        // TODO: check there's no MPA_CANCEL, MPA_REJECT?

        data.params[0] = orderItem;
        data.params[2] = identity;

        return data;
    }

    public usage(): string {
        return this.getName() + ' [<orderItemId> [<memo>]]] ';
    }

    public help(): string {
        return this.usage() + ' -  ' + this.description() + '\n'
            + '    <orderItemId>            - number, the id of the OrderItem for which we want to refund the Escrow.\n'
            + '    <memo>                   - [optional] string, the memo for the Escrow ';
    }

    public description(): string {
        return 'Refund an escrow.';
    }

    public example(): string {
        return '';
    }
}
