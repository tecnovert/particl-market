// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as express from 'express';
import { Environment } from './helpers/Environment';

export class CliIndex {

    public static getRoute(): string {
        return process.env.CLI_ROUTE as string;
    }

    public setup(app: express.Application): void {
        if (Environment.isTruthy(process.env.CLI_ENABLED)) {
            app.use(express.static('public'));
        }
    }
}
