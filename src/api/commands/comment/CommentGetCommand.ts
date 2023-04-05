// Copyright (c) 2017-2023, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { inject, named } from 'inversify';
import { validate, request } from '../../../core/api/Validate';
import { Logger as LoggerType } from '../../../core/Logger';
import { Types, Core, Targets } from '../../../constants';
import { CommentService } from '../../services/model/CommentService';
import { RpcRequest } from '../../requests/RpcRequest';
import { Comment } from '../../models/Comment';
import { RpcCommandInterface } from '../RpcCommandInterface';
import { Commands} from '../CommandEnumType';
import { BaseCommand } from '../BaseCommand';
import { ModelNotFoundException } from '../../exceptions/ModelNotFoundException';
import { CommandParamValidationRules, NumberOrStringValidationRule, ParamValidationRule } from '../CommandParamValidation';

export class CommentGetCommand extends BaseCommand implements RpcCommandInterface<Comment> {

    constructor(
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType,
        @inject(Types.Service) @named(Targets.Service.model.CommentService) public commentService: CommentService
    ) {
        super(Commands.COMMENT_GET);
        this.log = new Logger(__filename);
    }

    public getCommandParamValidationRules(): CommandParamValidationRules {
        return {
            params: [
                new NumberOrStringValidationRule('id|hash', true)
            ] as ParamValidationRule[]
        } as CommandParamValidationRules;
    }

    /**
     * data.params[]:
     * [0]: id or hash
     *
     * when data.params[0] is number then findById, else findOneByHash
     *
     * @param data
     * @returns {Promise<Comment>}
     */
    @validate()
    public async execute( @request(RpcRequest) data: RpcRequest): Promise<Comment> {
        if (typeof data.params[0] === 'number') {
            return await this.commentService.findOne(data.params[0])
                .catch(() => {
                    throw new ModelNotFoundException('Comment');
                });
        } else {
            return await this.commentService.findOneByHash(data.params[0])
                .catch(() => {
                    throw new ModelNotFoundException('Comment');
                });
        }
    }

    /**
     * data.params[]:
     * [0]: id or hash
     *
     * @param data
     * @returns {Promise<ItemCategory>}
     */
    public async validate(data: RpcRequest): Promise<RpcRequest> {
        await super.validate(data);
        return data;
    }

    public usage(): string {
        return this.getName() + ' <hash> ';
    }

    public help(): string {
        return this.usage() + ' -  ' + this.description() + ' \n'
            + '    <id|hash>              - String - The id or hash of the Comment we want to retrieve. ';
    }

    public description(): string {
        return 'Get a Comment.';
    }

    public example(): string {
        return 'comment ' + this.getName() + ' d7d3829e4a1acbbc26029f448510f1a684ba3797b95b28ac5a323c37fd69db14';
    }
}
