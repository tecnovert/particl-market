// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as http from 'http';
import * as express from 'express';
import { InversifyExpressServer } from 'inversify-express-utils';
import { Server } from './Server';
import { Logger } from './Logger';
import { ApiInfo } from './ApiInfo';
import { IoC } from './IoC';
import { CliIndex } from './CliIndex';
import { SocketIoServer } from './SocketIoServer';
import { ZmqWorker } from './ZmqWorker';
import { exceptionHandler } from './api/exceptionHandler';

export class Bootstrap {

    public log: Logger = new Logger(__filename);

    constructor() {
        // nothing explicit to do
    }

    public defineExpressApp(app: express.Application): express.Application {
        app.set('host', process.env.APP_HOST);
        app.set('port', Server.normalizePort(process.env.APP_PORT || '45492'));
        return app;
    }

    public setupCoreTools(app: express.Application): void {
        const apiInfo = new ApiInfo();
        apiInfo.setup(app);

        const cliIndex = new CliIndex();
        cliIndex.setup(app);
    }

    public startServer(app: express.Application): http.Server {
        return app.listen(app.get('port'));
    }

    public setupInversifyExpressServer(app: express.Application, ioc: IoC): InversifyExpressServer {
        const inversifyExpressServer = new InversifyExpressServer(ioc.container, undefined, {
            rootPath: process.env.APP_URL_PREFIX as string
        }, app);
        inversifyExpressServer.setErrorConfig((a) => a.use(exceptionHandler));
        return inversifyExpressServer;
    }

    public bindInversifyExpressServer(app: express.Application, inversifyExpressServer: InversifyExpressServer): express.Application {
        try {
            app = inversifyExpressServer.build();
        } catch (e: any) {
            this.log.error(e.message);
            process.exit(1);
        }
        return app;
    }

    public createSocketIoServer(server: Server, ioc: IoC): SocketIoServer {
        return new SocketIoServer(server.httpServer, ioc);
    }

    public createZmqWorker(ioc: IoC): ZmqWorker {
        return new ZmqWorker(ioc);
    }

}
