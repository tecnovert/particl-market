// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { Logger } from '../../../src/core/Logger';


export class LogMock extends Logger {

    public debugMock = jest.fn();
    public infoMock = jest.fn();
    public warnMock = jest.fn();
    public errorMock = jest.fn();

    public debug(message: string, ...args: any[]): void {
        this.debugMock('debug', message, args);
    }

    public info(message: string, ...args: any[]): void {
        this.infoMock('info', message, args);
    }

    public warn(message: string, ...args: any[]): void {
        this.warnMock('warn', message, args);
    }

    public error(message: string, ...args: any[]): void {
        this.errorMock('error', message, args);
    }

}
