// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { inject, named } from 'inversify';
import { validate, request } from '../../../core/api/Validate';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { ChatService, CHAT_ERRORS } from '../../services/model/ChatService';
import { RpcRequest } from '../../requests/RpcRequest';
import { EnumHelper } from '../../../core/helpers/EnumHelper';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { Commands} from '../CommandEnumType';
import { BaseCommand } from '../BaseCommand';
import { CommandParamValidationRules, ParamValidationRule, StringValidationRule } from '../CommandParamValidation';


type ChatErrors = CHAT_ERRORS | 'GENERIC_ERROR';


interface ChatResponse {
    success: boolean;
    errorReason?: ChatErrors;
}


export class ChatParticipantUpdateCommand extends BaseCommand implements RpcCommandInterface<ChatResponse> {

    private HELP_FIELDS: Array<{ name: string; description: string; required: boolean; valueType: string; exampleValue: string }> = [
        {
            name: 'address',
            description: 'The address of the participant',
            required: true,
            valueType: 'string',
            exampleValue: 'pccLpgGdZHMyb1Ls3JwEgxyJiqj2YJemWr'
        },
        {
            name: 'label',
            description: 'an appropriate label to identify the address by (omit the label to remove a set value), max-length: 100',
            required: false,
            valueType: 'string',
            exampleValue: '\'Bestest person ever!\''
        }

    ];

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.model.ChatService) private chatService: ChatService
    ) {
        super(Commands.CHAT_PARTICIPANT_UPDATE);
        this.log = new Logger(__filename);
    }

    public getCommandParamValidationRules(): CommandParamValidationRules {
        return {
            params: [
                new StringValidationRule('address', true, '', async (value) => (typeof value === 'string') && (value.length > 0) && (value.length < 255)),
                new StringValidationRule('label', false, '', async (value) => (typeof value === 'string') ? (value.length >= 0) && (value.length < 100) : true)
            ] as ParamValidationRule[]
        } as CommandParamValidationRules;
    }

    /**
     *
     * @param data
     * @returns {Promise<ChatResponse>}
     */
    @validate()
    public async execute( @request(RpcRequest) data: RpcRequest): Promise<ChatResponse> {

        const retVal: ChatResponse = {
            success: true
        };

        const success = await this.chatService.updateParticipantLabel(data.params[0], data.params[1])
            .catch(err => {
                this.log.error(`updating participant failed: `, err);
                retVal.errorReason = (EnumHelper.containsValue(CHAT_ERRORS, err.message)) ?
                    (err.message as CHAT_ERRORS) : 'GENERIC_ERROR' ;
                return false;
            });
        retVal.success = success;

        return retVal;
    }

    /**
     * @param data
     */
    public async validate(data: RpcRequest): Promise<RpcRequest> {
        await super.validate(data);
        return data;
    }

    public usage(): string {
        return `${this.getName()} ${this.HELP_FIELDS.map(f => (f.required ? '' : '[') + '<' + f.name + '>' + (f.required ? '' : ']')).join(' ')}`;
    }

    public help(): string {
        return this.usage() + ' -  ' + this.description() + ' \n' + this.HELP_FIELDS.map(f => {
            const n = `   <${f.name}>`;
            const p = ' '.repeat((n.length > 5) && (n.length < 26) ? 26 - n.length : 0);
            return n + p + `- [${f.required ? 'required' : 'optional'}] ${f.valueType} ; ${f.description}.\n`;
        }).join('');
    }

    public description(): string {
        return 'Add/Remove a label for a chat participant address to more easily identify them';
    }

    public example(): string {
        return 'chat ' + this.getName() + ' ' + this.HELP_FIELDS.map(f => f.exampleValue).join(' ');
    }
}
