// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { Request, Response, NextFunction } from 'express';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../core/Logger';
import { Types, Core, Targets } from '../../constants';
import { ServerStartedListener } from '../listeners/ServerStartedListener';

export class RestApiMiddleware implements interfaces.Middleware {

    public log: LoggerType;

    constructor(
        @inject(Types.Listener) @named(Targets.Listener.ServerStartedListener) private serverStartedListener: ServerStartedListener,
        @inject(Types.Core) @named(Core.Logger) Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }


    public use = (req: Request, res: Response, next: NextFunction): void => {

        if (!this.serverStartedListener.isStarted) {
            return this.setFailureResponse(res, 503, 'Server not fully started yet, is particld running?');
        }

        next();
    };


    private setFailureResponse(res: Response, errCode: number, message: string, error?: any): any {
        res.status(errCode);
        return res.json({
            success: false,
            message,
            ...{ error }
        });
    }

}
