// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

/**
 * APPLICATION CONFIGURATION
 * ----------------------------------------
 *
 * This is the place to add any other express module and register
 * all your custom middlewares and routes.
 */

import * as path from 'path';
import * as cors from 'cors';
import * as morgan from 'morgan';
import helmet from 'helmet';
import * as express from 'express';
import * as favicon from 'serve-favicon';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import { Logger } from '../core/Logger';
import { App, Configurable } from '../core/App';
import { CliIndex } from '../core/CliIndex';


const unless = (middleware: (...params: any[]) => any, ...excludedPaths: string[]) =>
    (req: express.Request, res: express.Response, next: express.NextFunction) =>
        excludedPaths.some(excludedPath => excludedPath && req.path.startsWith(excludedPath)) ? next() : middleware(req, res, next);

export class AppConfig implements Configurable {
    public configure(app: App): void {

        const logger = new Logger();

        app.Express
            // Enabling the cors headers
            // .options('*', cors())
            .use(unless(cors(), CliIndex.getRoute()))

            // Helmet helps you secure your Express apps by setting various HTTP headers. It's not a silver bullet, but it can help!
            .use(
                unless(
                    helmet({
                        hsts: { maxAge: 31536000, includeSubDomains: true },
                        crossOriginResourcePolicy: { policy: 'cross-origin' }
                    }),
                    CliIndex.getRoute()
                )
            )

            // Compress response bodies for all request that traverse through the middleware
            .use(compression())

            // Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
            // TODO: decide on some limit
            .use(bodyParser.json({ limit: '5mb' }))
            .use(bodyParser.urlencoded({
                limit: '5mb',
                extended: true
            }))

            // Serve static files like images from the public folder
            .use(express.static(path.join(__dirname, '..', 'public'), { maxAge: Infinity }))

            // A favicon is a visual cue that client software, like browsers, use to identify a site
            .use(favicon(path.join(__dirname, '..', 'public', 'favicon.ico')))

            // HTTP request logger middleware for node.js
            .use(morgan('dev', {
                stream: {
                    write: logger.info.bind(logger)
                }
            }));
    }
}
