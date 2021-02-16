// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

/**
 * MakeListenerCommand
 * -------------------------------------
 *
 */
import { AbstractMakeCommand } from './lib/AbstractMakeCommand';


export class MakeListenerCommand extends AbstractMakeCommand {

    public static command = 'make:listener';
    public static description = 'Generate new listener';

    public type = 'Listener';
    public suffix = 'Listener';
    public template = 'listener.hbs';
    public target = 'api/listeners';

}
