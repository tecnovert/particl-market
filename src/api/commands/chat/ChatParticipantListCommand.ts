// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE


import { inject, named } from 'inversify';
import { validate } from '../../../core/api/Validate';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { ChatService, CHAT_ERRORS } from '../../services/model/ChatService';
import { RpcRequest } from '../../requests/RpcRequest';
import { ParticipantListItem } from '../../enums/Chat';
import { EnumHelper } from '../../../core/helpers/EnumHelper';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { Commands} from '../CommandEnumType';
import { BaseCommand } from '../BaseCommand';
import { CommandParamValidationRules, ParamValidationRule } from '../CommandParamValidation';


type ChatErrors = CHAT_ERRORS | 'GENERIC_ERROR';


interface ChatResponse {
    success: boolean;
    data: ParticipantListItem[];
    errorReason?: ChatErrors;
}


export class ChatParticipantListCommand extends BaseCommand implements RpcCommandInterface<ChatResponse> {

    private HELP_FIELDS: Array<{ name: string; description: string; required: boolean; valueType: string; exampleValue: string }> = [

    ];

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.model.ChatService) private chatService: ChatService
    ) {
        super(Commands.CHAT_PARTICIPANT_LIST);
        this.log = new Logger(__filename);
    }

    public getCommandParamValidationRules(): CommandParamValidationRules {
        return {
            params: [
            ] as ParamValidationRule[]
        } as CommandParamValidationRules;
    }

    /**
     *
     * @param data
     * @returns {Promise<ChatResponse>}
     */
    @validate()
    public async execute(): Promise<ChatResponse> {

        const retVal: ChatResponse = {
            success: true,
            data: []
        };

        const pList = await this.chatService.listSavedParticipants()
            .catch(err => {
                this.log.error(`fetching saved participants list errored: `, err);
                retVal.errorReason = (EnumHelper.containsValue(CHAT_ERRORS, err.message)) ?
                    (err.message as CHAT_ERRORS) : 'GENERIC_ERROR' ;
                return [] as ParticipantListItem[];
            });
        retVal.success = retVal.errorReason ? false : true;
        retVal.data = pList;
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
        return 'Lists all the saved participants (NOTE: this is a static list, and saved details for a participant is shared across all identities).';
    }

    public example(): string {
        return 'chat ' + this.getName() + ' ' + this.HELP_FIELDS.map(f => f.exampleValue).join(' ');
    }
}
