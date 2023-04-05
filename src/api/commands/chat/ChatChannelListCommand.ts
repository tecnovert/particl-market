// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as resources from 'resources';
import { inject, named } from 'inversify';
import { validate, request } from '../../../core/api/Validate';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { ChatService, CHAT_ERRORS, ChannelSearchParams } from '../../services/model/ChatService';
import { RpcRequest } from '../../requests/RpcRequest';
import { ChannelListItem, ChatChannelType } from '../../enums/Chat';
import { EnumHelper } from '../../../core/helpers/EnumHelper';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { Commands} from '../CommandEnumType';
import { BaseCommand } from '../BaseCommand';
import { IdentityService } from '../../services/model/IdentityService';
import { CommandParamValidationRules, IdValidationRule, ParamValidationRule, EnumValidationRule, BooleanValidationRule } from '../CommandParamValidation';
import { InvalidParamException } from '../../exceptions/InvalidParamException';
import { IdentityType } from '../../enums/IdentityType';


type ChannelListtResponseErrors = CHAT_ERRORS | 'GENERIC_ERROR';


interface ChannelListResponse {
    success: boolean;
    data: ChannelListItem[];
    errorReason?: ChannelListtResponseErrors;
}


export class ChatChannelListCommand extends BaseCommand implements RpcCommandInterface<ChannelListResponse> {

    private HELP_FIELDS: Array<{ name: string; description: string; required: boolean; valueType: string; exampleValue: string }> = [
        {
            name: 'identityId',
            description: 'The ID of the identity for which channels should be listed',
            required: true,
            valueType: 'number',
            exampleValue: '2'
        },
        {
            name: 'channelType',
            description: 'The type/category of the channel that should be listed { ' + EnumHelper.getValues(ChatChannelType).join(' | ') + ' }',
            required: false,
            valueType: 'ChannelTypeField',
            exampleValue: ''
        },
        {
            name: 'showChannelDetails',
            description: 'Whether to include the channel item\'s details with the channel (default: false)',
            required: false,
            valueType: 'boolean',
            exampleValue: ''
        }
    ];

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.model.ChatService) private chatService: ChatService,
        @inject(Types.Service) @named(Targets.Service.model.IdentityService) private identityService: IdentityService
    ) {
        super(Commands.CHAT_CHANNEL_LIST);
        this.log = new Logger(__filename);
    }

    public getCommandParamValidationRules(): CommandParamValidationRules {
        return {
            params: [
                new IdValidationRule('identityId', true, this.identityService),
                new EnumValidationRule('channelType', false, 'ChatChannelType', EnumHelper.getValues(ChatChannelType) as string[]),
                new BooleanValidationRule('showChannelDetails', false, false)
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
        const requestData: ChannelSearchParams = {
            identityId: data.params[0].id,
            channelType: data.params[1]
        };

        const retVal: ChannelListResponse = {
            success: true,
            data: []
        };

        const values = await this.chatService.listFollowedChannels(requestData, !!data.params[2])
            .catch(err => {
                this.log.error('Fetching chat channel list errored: ', err);
                retVal.errorReason = (EnumHelper.containsValue(CHAT_ERRORS, err.message)) ?
                    (err.message as CHAT_ERRORS) : 'GENERIC_ERROR' ;
                retVal.success = false;
                return [] as ChannelListItem[];
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
        return 'List the chat channels "followed"';
    }

    public example(): string {
        return 'chat ' + this.getName() + ' ' + this.HELP_FIELDS.map(f => f.exampleValue).join(' ');
    }
}
