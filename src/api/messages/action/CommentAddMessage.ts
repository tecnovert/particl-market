// Copyright (c) 2017-2021, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { MessageBody } from '../../../core/api/MessageBody';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ActionMessageInterface } from './ActionMessageInterface';
import { CommentAction } from '../../enums/CommentAction';
import { CommentCategory } from '../../enums/CommentCategory';

export class CommentAddMessage extends MessageBody implements ActionMessageInterface {

    @IsNotEmpty()
    @IsEnum(Comment)
    public type: CommentAction.MPA_COMMENT_ADD;

    @IsNotEmpty()
    public sender: string;

    @IsNotEmpty()
    public receiver: string;

    @IsNotEmpty()
    @IsEnum(CommentCategory)
    public commentType: CommentCategory;

    @IsNotEmpty()
    public target: string;

    public message: string;

    public parentCommentHash: string;

    @IsNotEmpty()
    public signature: string;

    // all ActionMessages have these
    @IsNotEmpty()
    public hash: string;
    @IsNotEmpty()
    public generated: number;
}
