// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { inject, named } from 'inversify';
import { RpcRequest } from '../../requests/RpcRequest';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { validate, request } from '../../../core/api/Validate';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { BaseCommand } from '../BaseCommand';
import { Commands } from '../CommandEnumType';
import { CoreRpcService } from '../../services/CoreRpcService';

export class DaemonRootCommand extends BaseCommand implements RpcCommandInterface<any> {

    public log: LoggerType;

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.CoreRpcService) public coreRpcService: CoreRpcService
    ) {
        super(Commands.DAEMON_ROOT);
        this.log = new Logger(__filename);
    }

    /**
     *
     * @param data
     * @param rpcCommandFactory
     * @returns {Promise<void>}
     */
    @validate()
    public async execute( @request(RpcRequest) data: RpcRequest): Promise<any> {
        // this.log.debug('data.params:', data.params);
        const wallet = data.params.shift();
        const command = data.params.shift();
        const requestParams: any[] = [];
        for (const p of data.params) {
            try {
                requestParams.push(JSON.parse(typeof p === 'string' ? p : `${p}`));
                continue;
            } catch(e) {
                // do nothing... handled next
            }
            requestParams.push(p);
        }
        return await this.coreRpcService.call(command, requestParams, wallet);
    }

    /**
     *
     * @param data
     */
    public async validate(data: RpcRequest): Promise<RpcRequest> {
        // todo: validations
        data.params[0] = data.params[0] === '*' ? undefined : data.params[0];
        return data;
    }

    public usage(): string {
        return this.getName() + ' <wallet|*> <command> [arg] [arg] [...]  -  ' + this.description();
    }

    public help(): string {
        return this.usage() + '\n'
            + '    <wallet>     - string - The wallet to execute the command on. \n'
            + '    <command>    - string - The command to execute. \n'
            + '    <arg>        - string - An argument for the rpc command. ';
    }

    public description(): string {
        return 'Perform an rpc command on the Particl daemon.';
    }

    public example(): string {
        return '';
    }
}
