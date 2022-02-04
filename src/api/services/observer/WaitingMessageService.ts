// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import * as resources from 'resources';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../../core/Logger';
import { Core, Targets, Types } from '../../../constants';
import { EventEmitter } from '../../../core/api/events';
import { SmsgMessageService } from '../model/SmsgMessageService';
import { SmsgMessageSearchParams } from '../../requests/search/SmsgMessageSearchParams';
import { SmsgMessageStatus } from '../../enums/SmsgMessageStatus';
import { SearchOrder } from '../../enums/SearchOrder';
import { SmsgMessageFactory } from '../../factories/model/SmsgMessageFactory';
import { ActionMessageTypes } from '../../enums/ActionMessageTypes';
import { ActionDirection } from '../../enums/ActionDirection';
import { SmsgMessageSearchOrderField } from '../../enums/SearchOrderField';
import { BaseObserverService } from './BaseObserverService';
import { ObserverStatus } from '../../enums/ObserverStatus';
import { MarketplaceMessageProcessor } from '../../messageprocessors/MarketplaceMessageProcessor';

export class WaitingMessageService extends BaseObserverService {

    constructor(
        // tslint:disable:max-line-length
        @inject(Types.MessageProcessor) @named(Targets.MessageProcessor.MarketplaceMessageProcessor) private marketplaceMessageProcessor: MarketplaceMessageProcessor,
        @inject(Types.Factory) @named(Targets.Factory.model.SmsgMessageFactory) private smsgMessageFactory: SmsgMessageFactory,
        @inject(Types.Service) @named(Targets.Service.model.SmsgMessageService) private smsgMessageService: SmsgMessageService,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Core) @named(Core.Events) public eventEmitter: EventEmitter
        // tslint:enable:max-line-length
    ) {
        super(__filename, 5 * 1000, Logger);
    }

    /**
     * Fetch the WAITING SmsgMessages and pass them to MarketplaceMessageProcessor for reprocessing
     *
     * @param currentStatus
     */
    public async run(currentStatus: ObserverStatus): Promise<ObserverStatus> {

        const smsgMessages: resources.SmsgMessage[] = await this.getWaitingSmsgMessages();

        if (!_.isEmpty(smsgMessages) && smsgMessages.length > 0) {
            for (const smsgMessage of smsgMessages) {
                if (this.shouldReprocessMessage(smsgMessage)) {
                    this.log.debug('PROCESSING: ', smsgMessage.msgid);
                    // this.log.debug('smsgMessage:', JSON.stringify(smsgMessage, null, 2));

                    // marketplaceMessageProcessor.process() will update status and processed count and time
                    // before adding the message to processing queue
                    // the message processing result will be updated later in actionMessageProcessor.process()
                    await this.marketplaceMessageProcessor.process(smsgMessage.msgid);
                }
            }
        }

        return ObserverStatus.RUNNING;
    }

    /**
     * dont reprocess everything all the time:
     * for first 10 tries, wait for 2 minutes in between
     * for next 10 tries, wait for 10 minutes in between
     * for next 10 tries, wait for 1 hour in between
     * finally, until expired, wait for 1 day in between
     *
     */
    private shouldReprocessMessage(smsgMessage: resources.SmsgMessage): boolean {
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;

        if (smsgMessage.processedCount <= 10) {
            return Date.now() > smsgMessage.processedAt + (2 * minute);
        } else if (smsgMessage.processedCount <= 20) {
            return Date.now() > smsgMessage.processedAt + (10 * minute);
        } else if (smsgMessage.processedCount <= 30) {
            return Date.now() > smsgMessage.processedAt + hour;
        } else {
            return Date.now() > smsgMessage.processedAt + day;
        }
    }

    /**
     *
     * @returns {Promise<module:resources.SmsgMessage[]>}
     */
    private async getWaitingSmsgMessages(): Promise<resources.SmsgMessage[]> {

        const searchParams = {
            orderField: SmsgMessageSearchOrderField.RECEIVED,
            order: SearchOrder.DESC,
            direction: ActionDirection.INCOMING,
            status: SmsgMessageStatus.WAITING,  // but only the ones WAITING to be reprocessed for reason or another
            types: [] as ActionMessageTypes[],  // search all types of MarketplaceMessages
            page: 0,
            pageLimit: 10,
            age: 1000 * 20      // at least 20s old ones
        } as SmsgMessageSearchParams;

        const smsgMessages: resources.SmsgMessage[] = await this.smsgMessageService.searchBy(searchParams).then(value => value.toJSON());

        if (!_.isEmpty(smsgMessages) && smsgMessages.length > 0) {
            this.log.debug('getWaitingSmsgMessages(), found ' + smsgMessages.length + ' messages.');
        }

        return smsgMessages;
    }
}
