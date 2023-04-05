// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

/**
 * core.api.exceptionHandler
 * ------------------------------------------------
 *
 * This handler catches all thrown exceptions from the api layer. Afterwards it
 * send them directly to the client or otherwise it calls the next middleware.
 */

import { Request, Response, NextFunction } from 'express';
import { Environment } from '../helpers/Environment';
import { Exception, isException } from '../api/Exception';


const setFailureResponse = (res: Response, errCode: number, message: string, error?: any): any => {
    res.status(errCode);
    return res.json({
        success: false,
        message,
        ...{ error }
    });
};

export const exceptionHandler = (error: Exception | Error, req: Request, res: Response, next: NextFunction): void => {
    if (error instanceof Exception || error[isException]) {
        setFailureResponse(res, error['code'], error.message, error['body'] || null);
        next();
    } else {
        if (Environment.isDevelopment() || Environment.isAlpha() || Environment.isTest()) {
            console.error(error.stack);
        }
        setFailureResponse(res, 500, 'Something broke!', error['body'] || null);
        next(error);
    }
};
