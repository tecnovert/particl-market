// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as resources from 'resources';
import { inject, named } from 'inversify';
import { validate, request } from '../../../core/api/Validate';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { ChatService, CHAT_ERRORS, ChannelMessageListParams } from '../../services/model/ChatService';
import { RpcRequest } from '../../requests/RpcRequest';
import { ChatChannelType, ChannelMessage } from '../../enums/Chat';
import { EnumHelper } from '../../../core/helpers/EnumHelper';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { Commands} from '../CommandEnumType';
import { BaseCommand } from '../BaseCommand';
import { IdentityService } from '../../services/model/IdentityService';
import { CommandParamValidationRules, IdValidationRule, ParamValidationRule,
    EnumValidationRule, StringValidationRule, NumberValidationRule } from '../CommandParamValidation';
import { InvalidParamException } from '../../exceptions/InvalidParamException';
import { IdentityType } from '../../enums/IdentityType';


type ChannelListtResponseErrors = CHAT_ERRORS | 'GENERIC_ERROR';


interface ChannelListResponse {
    success: boolean;
    data: ChannelMessage[];
    errorReason?: ChannelListtResponseErrors;
}


export class ChatChannelMessagesCommand extends BaseCommand implements RpcCommandInterface<ChannelListResponse> {

    private HELP_FIELDS: Array<{ name: string; description: string; required: boolean; valueType: string; exampleValue: string }> = [
        {
            name: 'identityId',
            description: 'The ID of the identity requesting the messages',
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
        },
        {
            name: 'count',
            description: 'Number of messages to retrieve (default: 20)',
            required: false,
            valueType: 'string',
            exampleValue: '20'
        },
        {
            name: 'fromMsg',
            description: 'The msgid of the message from which to start fetching messages (for pagination purposes)',
            required: false,
            valueType: 'string',
            exampleValue: ''
        }

    ];

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.model.ChatService) private chatService: ChatService,
        @inject(Types.Service) @named(Targets.Service.model.IdentityService) private identityService: IdentityService
    ) {
        super(Commands.CHAT_CHANNEL_MESSAGES);
        this.log = new Logger(__filename);
    }

    public getCommandParamValidationRules(): CommandParamValidationRules {
        return {
            params: [
                new IdValidationRule('identityId', true, this.identityService),
                new StringValidationRule('channel', true),
                new EnumValidationRule('channelType', true, 'ChatChannelType', EnumHelper.getValues(ChatChannelType) as string[]),
                new NumberValidationRule('count', false, 20),
                new StringValidationRule('fromMsg', false, undefined)
            ] as ParamValidationRule[]
        } as CommandParamValidationRules;
    }

    /**
     *
     * @param data
     * @returns {Promise<ChannelListResponse>}
     */
    @validate()
    public async execute( @request(RpcRequest) data: RpcRequest): Promise<ChannelListResponse> {

        const retVal: ChannelListResponse = {
            success: true,
            data: []
        };

        const requestData: ChannelMessageListParams = {
            identityId: data.params[0].id,
            channel: data.params[1],
            channelType: data.params[2],
            count: data.params[3],
            direction: 'DESC'
        };

        if (data.params[4]) {
            requestData.fromMsg = data.params[4];
        }

        const values = await this.chatService.fetchChannelMessages(requestData)
            .catch(err => {
                this.log.error(`Fetching messages for channel ${requestData.channel} errored:`, err);
                retVal.errorReason = (EnumHelper.containsValue(CHAT_ERRORS, err.message)) ?
                    (err.message as CHAT_ERRORS) : 'GENERIC_ERROR' ;
                retVal.success = false;
                return [] as ChannelMessage[];
            });
        retVal.data = values;

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
        return 'Retrieve the messages from a channel.';
    }

    public example(): string {
        return 'chat ' + this.getName() + ' ' + this.HELP_FIELDS.map(f => f.exampleValue).join(' ');
    }
}
