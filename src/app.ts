// Copyright (c) 2017-2021, The Particl Market developers
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


export const app = newApp;
