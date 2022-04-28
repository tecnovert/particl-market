// Copyright (c) 2017-2022, The Particl Market developers
// Copyright (c) 2017-2022, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as resources from 'resources';
import { inject, named } from 'inversify';
import { request, validate } from '../../../core/api/Validate';
import { Logger as LoggerType } from '../../../core/Logger';
import { EnumHelper } from '../../../core/helpers/EnumHelper';
import { Core, Targets, Types } from '../../../constants';
import { RpcRequest } from '../../requests/RpcRequest';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { Commands } from '../CommandEnumType';
import { BaseCommand } from '../BaseCommand';
import { InvalidParamException } from '../../exceptions/InvalidParamException';
import { ChatAddActionService, SendChatParams, ADD_ACTION_ERRORS } from '../../services/action/ChatAddActionService';
import { ChatChannelType } from '../../enums/Chat';
import { IdentityService } from '../../services/model/IdentityService';
import { IdentityType } from '../../enums/IdentityType';
import {
    CommandParamValidationRules,
    IdValidationRule,
    ParamValidationRule,
    StringValidationRule,
    EnumValidationRule
} from '../CommandParamValidation';


type ChatPostResponseErrors = ADD_ACTION_ERRORS | 'GENERIC_ERROR';

interface ChatPostResponse {
    success: boolean;
    errorReason?: ChatPostResponseErrors;
    id: string;
}

interface IdentityData {
    address: string;
    wallet: string;
    id: number;
}


export class ChatMessagePostCommand extends BaseCommand implements RpcCommandInterface<ChatPostResponse> {

    private MESSAGE_MAX_LENGTH = 500;

    private HELP_FIELDS: Array<{ name: string; description: string, required: boolean, valueType: string, exampleValue: string }> = [
        {
            name: 'identityId',
            description: 'The ID of the identity posting the message',
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
            name: 'message',
            description: `the message to be sent (max length: ${this.MESSAGE_MAX_LENGTH})`,
            required: true,
            valueType: 'string',
            exampleValue: '"hello there"'
        }

    ];

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.action.ChatAddActionService) public chatActionService: ChatAddActionService,
        @inject(Types.Service) @named(Targets.Service.model.IdentityService) private identityService: IdentityService
    ) {
        super(Commands.CHAT_CHANNEL_POST);
        this.log = new Logger(__filename);
    }

    public getCommandParamValidationRules(): CommandParamValidationRules {
        return {
            params: [
                new IdValidationRule('identityId', true, this.identityService),
                new StringValidationRule('channel', true),
                new EnumValidationRule('channelType', true, 'ChatChannelType', EnumHelper.getValues(ChatChannelType) as string[]),
                new StringValidationRule('message', true, '', async (value) =>
                    (typeof value === 'string') && (value.trim().length > 0) && (value.length <= this.MESSAGE_MAX_LENGTH)
                )
            ] as ParamValidationRule[]
        } as CommandParamValidationRules;
    }

    /**
     * data.params[]:
     *  [0]: identityId, IdentityData
     *  [1]: channel, string (listing hash or bid hash)
     *  [2]: channelType, ChatChannelType
     *  [3]: message, string
     *  [4]: recipientAddress, string
     *
     * @param data, RpcRequest
     * @returns {Promise<ChatPostResponse>}
     */
    @validate()
    public async execute( @request(RpcRequest) data: RpcRequest): Promise<ChatPostResponse> {

        const retValue: ChatPostResponse = {
            success: false,
            id: ''
        };

        const identityData: IdentityData = data.params[0];
        const channel = data.params[1];

        const sendParams: SendChatParams = {
            channel,
            senderAddress: identityData.address,
            wallet: identityData.wallet,
            identityId: identityData.id,
            recipient: data.params[4],
            channelType: data.params[2],
            message: data.params[3]
        };


        await this.chatActionService.sendMessage(sendParams).then(success => {
            if (!success) {
                return 'GENERIC_ERROR';
            }
            retValue.id = success;
            return null;
        }).catch((err: Error) => {
            return err.message;
        }).then(errMsg => {
            if (errMsg !== null) {
                retValue.errorReason = (EnumHelper.containsValue(ADD_ACTION_ERRORS, errMsg)) ?
                    (errMsg as ADD_ACTION_ERRORS) : 'GENERIC_ERROR' ;
                retValue.success = false;
                return;
            }
            retValue.success = true;
        });

        return retValue;
    }

    /**
     * data.params[]:
     *  [0]: identityId, number
     *  [1]: channel, string (listing hash or bid hash)
     *  [2]: channelType
     *  [3]: message
     *
     * @param {RpcRequest} data
     * @returns {Promise<RpcRequest>}
     */
    public async validate(data: RpcRequest): Promise<RpcRequest> {
        await super.validate(data);

        const identity: resources.Identity = data.params[0];
        const channel = data.params[1];
        const channelType = data.params[2];
        const message = data.params[3].trim();

        // make sure the Identity is of type IdentityType.MARKET
        if (identity.type !== IdentityType.MARKET) {
            throw new InvalidParamException('Identity', 'IdentityType.MARKET');
        }

        const recipientAddress = await this.chatActionService.getMessageChannelRecipient(identity, channel, channelType);

        if (!recipientAddress) {
            throw new InvalidParamException('channel', `valid hash from one of ${(EnumHelper.getValues(ChatChannelType) as string[]).join(' | ')}`);
        }

        const identityData: IdentityData = {
            id: identity.id,
            address: identity.address,
            wallet: identity.wallet
        };

        data.params[0] =  identityData;
        data.params[1] = channel;
        data.params[2] = channelType;
        data.params[3] = message;
        data.params[4] = recipientAddress;

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
        });
    }

    public description(): string {
        return 'Post a message to a specific channel.';
    }

    public example(): string {
        return 'chat ' + this.getName() + ' ' + this.HELP_FIELDS.map(f => f.exampleValue).join(' ');
    }
}
