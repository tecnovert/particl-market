// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { Logger as LoggerType } from '../../../core/Logger';
import { ObserverStatus } from '../../enums/ObserverStatus';
import pForever from 'pm-forever';
import delay from 'pm-delay';
import { unmanaged } from 'inversify';

export abstract class BaseObserverService {

    public log: LoggerType;
    public updated = 0;
    public status: ObserverStatus = ObserverStatus.STOPPED; // updated after the first run

    protected INTERVAL = 1000;
    private STOP = false;

    constructor(@unmanaged() observerClass: string, @unmanaged() observerLoopInterval: number, Logger: typeof LoggerType) {
        this.log = new Logger(observerClass);
        this.INTERVAL = observerLoopInterval;

        if (this.INTERVAL >= 0) {
            const seconds = observerLoopInterval / 1000;
            this.log.info(`Starting up, loop run interval: ${(seconds)} second${(seconds !== 1 ? 's' : '')}.`);
            this.start();
        }
    }

    /**
     * loop to handle the whatever observing you need to do...
     *
     * @param currentStatus
     */
    public abstract run(currentStatus: ObserverStatus): Promise<ObserverStatus>;

    public async start(): Promise<void> {

        const fn = async (previousValue: any) => {
            previousValue++;

            // this.log.info('running... ' + previousValue);
            this.status = await this.run(this.status)
                .catch(reason => {
                    this.log.error('ERROR: ', reason);
                    this.status = ObserverStatus.ERROR;
                    return ObserverStatus.ERROR;
                });
            this.updated = Date.now();
            if (this.STOP) {
                return pForever.end;
            }
            await delay(this.INTERVAL);

            return previousValue;
        };

        await pForever(fn, 0)
            .catch(async reason => {
                this.status = ObserverStatus.ERROR;
                this.log.error('ERROR: ', reason);
                await delay(this.INTERVAL);
                this.start();
            });

        this.log.error('BaseObserver stopped!');
    }

    public async stop(): Promise<void> {
        this.STOP = true;
    }

}
