// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../core/Logger';
import { Types, Core, Targets } from '../../constants';
import { ServerStartedListener } from '../listeners/ServerStartedListener';
// import { app } from '../../app';

export class RpcMiddleware implements interfaces.Middleware {

    public log: LoggerType;

    constructor(
        @inject(Types.Listener) @named(Targets.Listener.ServerStartedListener) private serverStartedListener: ServerStartedListener,
        @inject(Types.Core) @named(Core.Logger) Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    public use = (req: myExpress.Request, res: myExpress.Response, next: myExpress.NextFunction): void => {

        // fail if server isn't started and the method is anything else than market or wallet
        // we need to be able to set the default market and possibly create a wallet, while the server
        // is waiting for the default market settings
        if (!this.serverStartedListener.isStarted && (req.body.method !== 'market' && req.body.method !== 'wallet')) {
            return res.failed(503, 'Server not fully started yet, is particld running?');
        }

        // validate rpc request
        if (this.isValidVersionTwoRequest(req)) {
            next();
        } else {
            return res.failed(400, 'Invalid JSON-RPC 2.0 request');
        }
    }

    public isValidVersionTwoRequest(request: myExpress.Request): boolean {
        return (
            request
            && request.headers
            && request.headers['content-type']
            && request.headers['content-type'].indexOf('application/json') > -1
            && request.body
            && typeof (request.body) === 'object'
            && request.body.jsonrpc === '2.0'
            && typeof (request.body.method) === 'string'
            && (
                typeof (request.body.params) === 'undefined'
                || Array.isArray(request.body.params)
                || (request.body.params && typeof (request.body.params) === 'object')
            )
            && (
                typeof (request.body.id) === 'undefined'
                || typeof (request.body.id) === 'string'
                || typeof (request.body.id) === 'number'
                || request.body.id === null
            )
        );
    }
}
