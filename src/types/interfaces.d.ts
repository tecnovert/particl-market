// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { Request, Response, NextFunction } from 'express';

declare namespace interfaces {

    interface Middleware {
        use(req: Request, res: Response, next: NextFunction): void;
    }

    interface Listener {
        act<T>(value?: T): void;
        act(...args: any[]): void;
    }

    interface Configurable {
        configure<T>(instance: T): void;
    }

    interface LoggerAdapter {
        debug(message: string, ...args: any[]): void;
        info(message: string, ...args: any[]): void;
        warn(message: string, ...args: any[]): void;
        error(message: string, ...args: any[]): void;
    }

    /* eslint-disable @typescript-eslint/prefer-function-type */
    interface LoggerAdapterConstructor {
        new (scope: string): LoggerAdapter;
    }
    /* eslint-enable @typescript-eslint/prefer-function-type */

}

export as namespace interfaces;
export = interfaces;
