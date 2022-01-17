// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as resources from 'resources';
import * as _ from 'lodash';
import { inject, named } from 'inversify';
import { Types, Core, Targets } from '../../../constants';
import { Logger as LoggerType } from '../../../core/Logger';
import { SmsgMessageStatus } from '../../enums/SmsgMessageStatus';
import { MarketplaceMessageEvent } from '../../messages/MarketplaceMessageEvent';
import { SmsgMessageService } from '../../services/model/SmsgMessageService';
import { MPAction } from '@zasmilingidiot/omp-lib/dist/interfaces/omp-enums';
import { MarketplaceMessage } from '../../messages/MarketplaceMessage';
import { ListingItemService } from '../../services/model/ListingItemService';
import { ActionMessageProcessorInterface } from '../ActionMessageProcessorInterface';
import { BidFactory } from '../../factories/model/BidFactory';
import { BidAcceptMessage } from '../../messages/action/BidAcceptMessage';
import { BidAcceptActionService } from '../../services/action/BidAcceptActionService';
import { BidService } from '../../services/model/BidService';
import { ProposalService } from '../../services/model/ProposalService';
import { BaseBidActionMessageProcessor } from '../BaseBidActionMessageProcessor';
import { BidAcceptValidator } from '../../messagevalidators/BidAcceptValidator';
import { ActionDirection } from '../../enums/ActionDirection';
import { NotificationService } from '../../services/model/NotificationService';


export class BidAcceptActionMessageProcessor extends BaseBidActionMessageProcessor implements ActionMessageProcessorInterface {

    public static Event = Symbol(MPAction.MPA_ACCEPT);

    constructor(
        @inject(Types.Service) @named(Targets.Service.model.SmsgMessageService) public smsgMessageService: SmsgMessageService,
        @inject(Types.Service) @named(Targets.Service.action.BidAcceptActionService) public bidAcceptActionService: BidAcceptActionService,
        @inject(Types.Service) @named(Targets.Service.model.BidService) public bidService: BidService,
        @inject(Types.Service) @named(Targets.Service.model.ProposalService) public proposalService: ProposalService,
        @inject(Types.Service) @named(Targets.Service.model.NotificationService) public notificationService: NotificationService,
        @inject(Types.Service) @named(Targets.Service.model.ListingItemService) public listingItemService: ListingItemService,
        @inject(Types.Factory) @named(Targets.Factory.model.BidFactory) public bidFactory: BidFactory,
        @inject(Types.MessageValidator) @named(Targets.MessageValidator.BidAcceptValidator) public validator: BidAcceptValidator,
        @inject(Types.Core) @named(Core.Logger) Logger: typeof LoggerType
    ) {
        super(
            MPAction.MPA_ACCEPT,
            bidAcceptActionService,
            smsgMessageService,
            bidService,
            proposalService,
            notificationService,
            validator,
            listingItemService,
            bidFactory,
            Logger
        );
    }

    /**
     * handles the received BidAcceptMessage and return SmsgMessageStatus as a result
     *
     * TODO: check whether returned SmsgMessageStatuses actually make sense and the response to those
     *
     * @param event
     */
    public async onEvent(event: MarketplaceMessageEvent): Promise<SmsgMessageStatus> {

        const smsgMessage: resources.SmsgMessage = event.smsgMessage;
        const marketplaceMessage: MarketplaceMessage = event.marketplaceMessage;
        const actionMessage: BidAcceptMessage = marketplaceMessage.action as BidAcceptMessage;

        // - first get the previous Bid (MPA_BID), fail if it doesn't exist
        // - then get the ListingItem the Bid is for, fail if it doesn't exist
        // - then, save the new Bid (MPA_ACCEPT) and update the OrderItem.status and Order.status

        return await this.bidAcceptActionService.processMessage(marketplaceMessage, ActionDirection.INCOMING, smsgMessage)
            .then(value => {
                return SmsgMessageStatus.PROCESSED;
            })
            .catch(reason => {
                this.log.error('PROCESSING_FAILED, reason: ', reason);
                return SmsgMessageStatus.PROCESSING_FAILED;
            });
    }
}
