// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { Request, Response, NextFunction } from 'express';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../core/Logger';
import { Types, Core } from '../../constants';

export class AuthenticateMiddleware implements interfaces.Middleware {

    public log: LoggerType;

    constructor(@inject(Types.Core) @named(Core.Logger) Logger: typeof LoggerType) {
        this.log = new Logger(__filename);
    }

    public use = (req: Request, res: Response, next: NextFunction): void => {

        if (process.env.MARKET_RPC_AUTH_DISABLED) {
            return next();
        } else {
            if (req.headers.authorization && req.headers.authorization.search('Basic ') === 0) {
                const authentication = Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString();
                // this.log.debug('auth:' + authentication + '===' + process.env.MARKET_RPC_USER + ':' + process.env.MARKET_RPC_PASSWORD);

                if (authentication === `${process.env.MARKET_RPC_USER || ''}:${process.env.MARKET_RPC_PASSWORD || ''}`) {
                    return next();
                } else {
                    return this.setFailureResponse(res, 401, 'You are not allowed to request this resource!');
                }
            } else {
                return this.setFailureResponse(res, 401, 'You are not allowed to request this resource!');
            }
        }
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
