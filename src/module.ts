// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import 'reflect-metadata';

import * as path from 'path';
import { ChildProcess, fork } from 'child_process';

let proc: ChildProcess;

/**
 * Spawns the application in a seperate process
 */
exports.start = (envArgs: any) => {
    const p = path.join(__dirname, 'app.js');
    const environment = {
        APPDATA: process.env.APPDATA,
        NODE_ENV: 'alpha',
        INIT: true,
        MIGRATE: true,
        ELECTRON_RUN_AS_NODE: true
    };

    const envAdditional = envArgs && typeof envArgs === 'object' && envArgs.constructor === Object ? envArgs : {};
    const envActual = {...environment, ...envAdditional};

    proc = fork(p, [], { env: envActual, stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });
    proc.send('START');
    return proc;
};

/**
 * Stops the process.
 */
exports.stop = () => {
    if (proc) {
        if (proc.connected) {
            proc.send('STOP');
        } else {
            proc.kill('SIGINT');
        }
    }
};
