// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as resources from 'resources';
import { inject, named } from 'inversify';
import { validate, request } from '../../../core/api/Validate';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { ChatService, CHAT_ERRORS } from '../../services/model/ChatService';
import { RpcRequest } from '../../requests/RpcRequest';
import { ChatChannelType } from '../../enums/Chat';
import { EnumHelper } from '../../../core/helpers/EnumHelper';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { Commands} from '../CommandEnumType';
import { BaseCommand } from '../BaseCommand';
import { IdentityService } from '../../services/model/IdentityService';
import { CommandParamValidationRules, IdValidationRule, ParamValidationRule, EnumValidationRule, StringValidationRule } from '../CommandParamValidation';
import { InvalidParamException } from '../../exceptions/InvalidParamException';
import { IdentityType } from '../../enums/IdentityType';


type ChannelUnfollowResponseErrors = CHAT_ERRORS | 'GENERIC_ERROR';


interface ChatResponse {
    success: boolean;
    errorReason?: ChannelUnfollowResponseErrors;
}


export class ChatChannelUnfollowCommand extends BaseCommand implements RpcCommandInterface<ChatResponse> {

    private HELP_FIELDS: Array<{ name: string; description: string; required: boolean; valueType: string; exampleValue: string }> = [
        {
            name: 'identityId',
            description: 'The ID of the identity making the request',
            required: true,
            valueType: 'number',
            exampleValue: '2'
        },
        {
            name: 'channel',
            description: 'The hash identifying the specific channel',
            required: true,
            valueType: 'string',
            exampleValue: 'd21573220ba0b3e64866455352c7a3a563b714044450fd7c186e84faab91d207'
        },
        {
            name: 'channelType',
            description: 'The type/category of the channel { ' + EnumHelper.getValues(ChatChannelType).join(' | ') + ' }',
            required: true,
            valueType: 'ChannelTypeField',
            exampleValue: `${EnumHelper.getValues(ChatChannelType)[0]}`
        }
    ];

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.model.ChatService) private chatService: ChatService,
        @inject(Types.Service) @named(Targets.Service.model.IdentityService) private identityService: IdentityService
    ) {
        super(Commands.CHAT_CHANNEL_UNFOLLOW);
        this.log = new Logger(__filename);
    }

    public getCommandParamValidationRules(): CommandParamValidationRules {
        return {
            params: [
                new IdValidationRule('identityId', true, this.identityService),
                new StringValidationRule('channel', true),
                new EnumValidationRule('channelType', true, 'ChatChannelType', EnumHelper.getValues(ChatChannelType) as string[])
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

        const success = await this.chatService.unFollowChannel(data.params[0].id, data.params[1], data.params[2])
            .catch(err => {
                this.log.error(`Unfollowing channel ${data.params[1]} errored: `, err);
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

        const identity: resources.Identity = data.params[0];
        if (identity.type !== IdentityType.MARKET) {
            throw new InvalidParamException('Identity', 'IdentityType.MARKET');
        }
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
        return 'Remove a specific channel from the watched/followed list.';
    }

    public example(): string {
        return 'chat ' + this.getName() + ' ' + this.HELP_FIELDS.map(f => f.exampleValue).join(' ');
    }
}
