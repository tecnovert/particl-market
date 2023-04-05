// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

/**
 * EXPRESS TYPESCRIPT BOILERPLATE
 * ----------------------------------------
 *
 * This is a boilerplate for Node.js Application written in TypeScript.
 * The basic layer of this app is express. For further information visit
 * the 'README.md' file.
 *
 * To add express modules go to the 'config/AppConfig.ts' file. All the IOC registrations
 * are in the 'config/IocConfig.ts' file.
 */

import 'reflect-metadata';
import { envConfig } from './config/EnvironmentConfig';
import { App } from './core/App';
import { CustomConfig } from './config/CustomConfig';
import { Environment } from './core/helpers/Environment';
import * as dotenv from 'dotenv';

console.log('app, process.env.NODE_ENV:', process.env.NODE_ENV );

const config = envConfig();
// loads the .env file into the 'process.env' variable (this does not load anything if the config path doesn't exist yet)
dotenv.config({ path: config.envFile });

const newApp = new App();

console.log('app, Environment.isTest():', Environment.isTest());
console.log('app, Environment.isBlackBoxTest():', Environment.isBlackBoxTest());

const start = () => {

    if (!Environment.isTest() && !Environment.isBlackBoxTest()) {

        console.log('app, starting in non-test environment...');

        // integration tests will bootstrap the app
        newApp.configure(new CustomConfig());
        newApp.bootstrap()
            .catch(reason => {
                console.log('ERROR:', reason);
            });

    } else {
        console.log('app, starting in test environment...');
    }
};


const terminationHandler = (cleanup: (cb: (exitCode?: number) => void) => void, options = { timeout: 2000 }) => {

    const exitCB = (code: number = 0) => {
        process.exit(code);
    };

    return (code: number, reason: string) => (err: Error | undefined) => {

        if (err && err instanceof Error) {
            newApp.Logger('').error(err.message, err.stack);
        } else {
            newApp.Logger('').info(reason);
        }

        if (cleanup instanceof Function) {
            cleanup(exitCB);
            setTimeout(exitCB, options.timeout).unref();
        } else {
            exitCB(code);
        }
    };
};

const terminator = terminationHandler(() => {
    if (newApp.Server) {
        newApp.Server.httpServer.close();
    }
    if (newApp.SocketIOServer) {
        newApp.SocketIOServer.socketIO.close();
    }
    if (newApp.ZmqWorker) {
        newApp.ZmqWorker.zmq.disconnect().catch(() => false /* TODO: do something more useful here */);
    }
});


process.on('uncaughtException', terminator(1, 'uncaughtException'));
process.on('unhandledRejection', terminator(1, 'unhandledRejection'));
process.on('SIGTERM', terminator(0, 'exit requested - sigterm'));
process.on('SIGINT', terminator(0, 'exit requested - sigint'));

process.on('message', (msg: any) => {
    if (typeof msg === 'string') {
        switch (msg) {
        case 'START':
            start();
            break;
        case 'STOP':
            terminator(0, 'PROCESS STOP REQUESTED')(undefined);
            break;
        default:
            break;
        }
    }
});

export const app = newApp;
