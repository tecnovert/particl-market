// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as express from 'express';
import { Environment } from './helpers/Environment';


export class ApiInfo {

    public static getRoute(): string {
        return `${process.env.APP_URL_PREFIX || ''}${process.env.API_INFO_ROUTE || ''}`;
    }

    public setup(app: express.Application): void {
        if (Environment.isTruthy(process.env.API_INFO_ENABLED || '')) {
            app.get(
                ApiInfo.getRoute(),
                (req: express.Request, res: express.Response) => {
                    const pkg = Environment.getPkg();
                    const links = {
                        links: {}
                    };
                    // todo: get the pkg data somewhere
                    return res.json({
                        name: pkg.name,
                        version: pkg.version,
                        description: pkg.description,
                        ...links
                    });
                });
        }
    }
}
